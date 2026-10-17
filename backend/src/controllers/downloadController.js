'use strict';
const AdmZip = require('adm-zip');
const Chapter = require('../models/Chapter');
const Settings = require('../models/Settings');
const { readableSeries } = require('../middleware/contentAccess');
const { imageType, MAX_BATCH, MAX_IMAGE } = require('../utils/uploadValidation');
let activeDownloads = 0;
exports.download = async (req, res, next) => {
  let admitted = false;
  try {
    const chapter = await Chapter.findOne({ _id: req.params.id, visibility: 'public' });
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });
    const series = await readableSeries(req, chapter.seriesId);
    const settings = await Settings.findById('global').lean();
    if (!settings?.downloadsEnabled) return res.status(403).json({ success: false, message: 'Chapter downloads are disabled by the publisher.' });
    if (!chapter.pages.length || chapter.pages.length > 200) return res.status(400).json({ success: false, message: 'This chapter cannot be packaged for download.' });
    if (activeDownloads >= 2) return res.status(429).json({ success: false, message: 'Chapter downloads are busy. Please try again shortly.' });
    activeDownloads++; admitted = true;
    const zip = new AdmZip(); let total = 0;
    for (const [index, page] of [...chapter.pages].sort((a, b) => a.order - b.order).entries()) {
      if (res.destroyed) return;
      // Read through an authenticated Drive client, never fetch arbitrary database URLs.
      const data = await require('../services/storageProvider').read(page.fileId, page.driveId);
      total += data.length;
      if (total > MAX_BATCH) return res.status(413).json({ success: false, message: 'This chapter exceeds the download size limit.' });
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[imageType(data)];
      zip.addFile(`${String(index + 1).padStart(4, '0')}.${ext}`, data);
    }
    res.attachment(`${series.slug || 'comic'}-chapter-${chapter.chapterNumber}.cbz`).type('application/vnd.comicbook+zip').send(zip.toBuffer());
  } catch (error) { next(error); } finally { if (admitted) activeDownloads--; }
};
