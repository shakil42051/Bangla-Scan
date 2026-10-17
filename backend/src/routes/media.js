'use strict';
const router = require('express').Router();
const Upload = require('../models/Upload');
const Chapter = require('../models/Chapter');
const Series = require('../models/Series');
const Settings = require('../models/Settings');
const local = require('../services/localStorage');
const { optionalAuth } = require('../middleware/auth');
const { readableSeries } = require('../middleware/contentAccess');
let remoteTransfers = 0;
router.get('/:fileId', optionalAuth, require('../services/mediaSession').load, async (req, res, next) => {
  try {
    if (!/^[A-Za-z0-9_-]{10,100}$/.test(req.params.fileId)) return res.status(404).json({ success: false, message: 'Image not found.' });
    const file = await Upload.findOne({ fileId: req.params.fileId, status: 'active' }).lean();
    if (!file) return res.status(404).json({ success: false, message: 'Image not found.' });
    const adminAllowed = req.isAdmin && (file.type === 'chapter_page' ? req.admin.hasPermission('manageChapters') : file.seriesId ? req.admin.hasPermission('manageSeries') : req.admin.hasPermission('manageHomepage') || req.admin.hasPermission('manageSettings'));
    if (!adminAllowed) {
      // A content-team cookie without publishing permission must not bypass public access.
      if (req.isAdmin) { req.isAdmin = false; req.user = null; }
      if (file.type === 'chapter_page') {
        const chapter = await Chapter.findOne({ _id: file.chapterId, 'pages.fileId': file.fileId, visibility: 'public' }).lean();
        if (!chapter) return res.status(404).json({ success: false, message: 'Image not found.' });
        await readableSeries(req, chapter.seriesId);
      } else {
        const series = await Series.findOne({ $or: [{ 'coverImage.fileId': file.fileId }, { 'bannerImage.fileId': file.fileId }] });
        if (series) await readableSeries(req, series._id, false);
        else {
          const [section, upcoming, config] = await Promise.all([
            require('../models/HomepageSection').exists({ isActive: true, 'bannerImage.fileId': file.fileId }),
            require('../models/UpcomingSeries').exists({ isActive: true, 'coverImage.fileId': file.fileId }),
            Settings.findById('global').lean(),
          ]);
          const mediaURL = '/api/media/' + file.fileId;
          if (!(section || upcoming || [config?.logoUrl, config?.faviconUrl].includes(mediaURL))) return res.status(404).json({ success: false, message: 'Image not published.' });
        }
      }
    }
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' });
    if (String(file.driveAccountId) === local.LOCAL_ID) {
      res.type(file.mimeType);
      return res.sendFile(local.filePath(file.fileId), error => { if (error && !res.headersSent) next(Object.assign(new Error('Image file is unavailable.'), { statusCode: error.code === 'ENOENT' ? 404 : 500 })); });
    }
    if (remoteTransfers >= 8) return res.status(429).json({ success: false, message: 'Images are busy. Retry this page shortly.' });
    remoteTransfers++; let released = false;
    const release = () => { if (!released) { remoteTransfers--; released = true; } };
    res.once('finish', release); res.once('close', release);
    try {
      const data = await require('../services/storageProvider').read(file.fileId, file.driveAccountId);
      res.type(require('../utils/uploadValidation').imageType(data)).send(data);
    } catch (error) { release(); throw error; }
  } catch (error) { next(error); }
});
module.exports = router;
