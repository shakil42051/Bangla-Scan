'use strict';
const { multerUpload, uploadFile, uploadChapterPages, replaceFile, deleteFile } = require('../services/uploadService');
const { getDriveAccountsSummary } = require('../services/driveService');
const Upload = require('../models/Upload');
const Chapter = require('../models/Chapter');
const Series = require('../models/Series');
const logger = require('../utils/logger');
const path = require('path');
const AdmZip = require('adm-zip');
const { validateBatch, imageType, MAX_IMAGE, MAX_BATCH, MAX_PAGES } = require('../utils/uploadValidation');
const { fail, pagination } = require('../utils/http');

// Helper to get mime type
function getMimeTypeByExtension(ext) {
  const mapping = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mapping[ext.toLowerCase()] || 'image/jpeg';
}

// ── Upload chapter pages (bulk) ───────────────────────────────────────────────
exports.uploadPages = async (req, res, next) => {
  try {
    const { chapterId, seriesId } = req.body;
    let files = req.files;
    const chapter = await Chapter.findOne({ _id: chapterId, seriesId });
    if (!chapter) throw fail(404, 'Save the target series and chapter before uploading.');

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided.' });
    }

    // Check if the first file is a ZIP or CBZ
    const firstFile = files[0];
    const ext = path.extname(firstFile.originalname).toLowerCase();
    
    if (ext === '.zip' || ext === '.cbz') {
      try {
        if (files.length !== 1) throw fail(400, 'Upload one archive at a time.');
        const zip = new AdmZip(firstFile.buffer);
        const zipEntries = zip.getEntries();
        
        const imageEntries = zipEntries.filter(entry => {
          if (entry.isDirectory || entry.entryName.split('/').some(part => part.startsWith('.') || part === '__MACOSX')) return false;
          const entryExt = path.extname(entry.entryName).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(entryExt);
        });

        if (imageEntries.length === 0) {
          return res.status(400).json({ success: false, message: 'No valid images found in the ZIP/CBZ archive.' });
        }

        if (zipEntries.length > 1000 || imageEntries.length > MAX_PAGES || imageEntries.some(e => e.header.size > MAX_IMAGE) || imageEntries.reduce((n, e) => n + e.header.size, 0) > MAX_BATCH) throw fail(413, 'Archive exceeds the page or decompressed size limit.');

        // Sort entries by name to preserve chapter pages order
        imageEntries.sort((a, b) =>
          a.entryName.localeCompare(b.entryName, undefined, { numeric: true })
        );

        // Map entries to simulated multer files
        files = imageEntries.map(entry => {
          const entryExt = path.extname(entry.entryName).toLowerCase();
          return {
            buffer: entry.getData(),
            originalname: entry.entryName,
            mimetype: getMimeTypeByExtension(entryExt),
            size: entry.header.size
          };
        });
      } catch (zipErr) {
        logger.error('Failed to parse ZIP/CBZ file:', zipErr);
        throw fail(zipErr.statusCode || 400, 'Archive rejected: ' + zipErr.message);
      }
    }

    files = validateBatch(files);
    if ((chapter.pages?.length || 0) + files.length > MAX_PAGES) throw fail(413, 'A chapter can contain at most 200 pages. Split large releases into chapters.');
    const pages = await uploadChapterPages({
      files,
      seriesId,
      chapterId,
      uploadedBy: req.admin._id,
    });

    // Pipeline update appends and renumbers against the latest document, including concurrent batches.
    let updated;
    try { updated = await Chapter.findOneAndUpdate({ _id: chapterId, seriesId, $expr: { $lte: [{ $add: [{ $size: { $ifNull: ['$pages', []] } }, pages.length] }, MAX_PAGES] } }, [
      { $set: { pages: { $concatArrays: [{ $ifNull: ['$pages', []] }, { $literal: pages }] } } },
      { $set: { pages: { $map: { input: { $range: [0, { $size: '$pages' }] }, as: 'i', in: { $mergeObjects: [{ $arrayElemAt: ['$pages', '$$i'] }, { order: { $add: ['$$i', 1] } }] } } }, pageCount: { $size: '$pages' } } },
    ], { new: true }); } catch (error) {
      await Promise.allSettled(pages.map(page => deleteFile(page.fileId, page.driveId)));
      throw error;
    }
    if (!updated) { await Promise.allSettled(pages.map(page => deleteFile(page.fileId, page.driveId))); }
    if (!updated) throw fail(409, 'The chapter changed during upload or reached its page limit. Refresh it before trying again.');

    res.json({ success: true, message: `${pages.length} page(s) uploaded.`, data: updated.pages.slice(-pages.length), pageCount: updated.pageCount });
  } catch (err) { next(err); }
};

// ── Upload single file (cover, banner, avatar) ────────────────────────────────
exports.uploadSingle = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file provided.' });

    const { seriesId, target = seriesId ? 'series' : 'media', targetId } = req.body;
    const type = target === 'homepage' ? 'banner' : target === 'upcoming' ? 'cover' : req.body.type || 'other';
    if (!['series', 'media', 'homepage', 'upcoming', 'logo', 'favicon'].includes(target)) throw fail(400, 'Invalid upload destination.');
    if (seriesId && target !== 'series') throw fail(400, 'Choose only one image destination.');
    if (target === 'series' && (!seriesId || !['cover', 'banner'].includes(type))) throw fail(400, 'Choose a series and a cover or banner image.');
    const permission = target === 'series' ? 'manageSeries' : ['homepage', 'upcoming'].includes(target) ? 'manageHomepage' : 'manageSettings';
    if (!req.admin.hasPermission(permission)) throw fail(403, 'You cannot upload to this destination.');
    if (target === 'homepage' && !await require('../models/HomepageSection').exists({ _id: targetId })) throw fail(404, 'Homepage section not found.');
    if (target === 'upcoming' && !await require('../models/UpcomingSeries').exists({ _id: targetId })) throw fail(404, 'Upcoming series not found.');
    imageType(file.buffer);
    if (!['cover', 'banner', 'avatar', 'other'].includes(type)) throw fail(400, 'Invalid upload type.');
    if (seriesId && !await Series.exists({ _id: seriesId })) throw fail(404, 'Series not found.');

    const upload = await uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type,
      seriesId,
      uploadedBy: req.admin._id,
    });

    // Update series cover/banner if requested
    if (seriesId && (type === 'cover' || type === 'banner')) {
      const field = type === 'cover' ? 'coverImage' : 'bannerImage';
      await Series.findByIdAndUpdate(seriesId, {
        [field]: { fileId: upload.fileId, driveId: upload.driveAccountId.toString(), url: upload.url },
      });
    }

    const ref = { fileId: upload.fileId, driveId: String(upload.driveAccountId), url: upload.url };
    if (target === 'homepage') await require('../models/HomepageSection').findByIdAndUpdate(targetId, { bannerImage: ref });
    if (target === 'upcoming') await require('../models/UpcomingSeries').findByIdAndUpdate(targetId, { coverImage: ref });
    if (target === 'logo' || target === 'favicon') await require('../models/Settings').findByIdAndUpdate('global', { [target === 'logo' ? 'logoUrl' : 'faviconUrl']: upload.url }, { upsert: true });

    res.json({ success: true, data: upload });
  } catch (err) { next(err); }
};

// ── Replace a file ────────────────────────────────────────────────────────────
exports.replaceFile = async (req, res, next) => {
  try {
    const { oldFileId, oldDriveAccountId, type, seriesId, chapterId } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file provided.' });
    const original = await Upload.findOne({ fileId: oldFileId, driveAccountId: oldDriveAccountId, status: 'active' });
    if (!original) throw fail(404, 'Original upload not found.');
    if (!req.admin.hasPermission(original.type === 'chapter_page' ? 'manageChapters' : original.seriesId ? 'manageSeries' : 'manageSettings')) throw fail(403, 'You cannot replace this file.');

    const upload = await replaceFile({
      oldFileId, oldDriveAccountId,
      newBuffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      type,
      seriesId,
      chapterId,
      uploadedBy: req.admin._id,
    });

    res.json({ success: true, message: 'File replaced.', data: upload });
  } catch (err) { next(err); }
};

// ── Delete a file ─────────────────────────────────────────────────────────────
exports.deleteFile = async (req, res, next) => {
  try {
    const { fileId, driveAccountId } = req.body;
    if (!fileId || !driveAccountId) {
      return res.status(400).json({ success: false, message: 'fileId and driveAccountId required.' });
    }
    await deleteFile(fileId, driveAccountId);
    res.json({ success: true, message: 'File deleted.' });
  } catch (err) { next(err); }
};

// ── List uploads ──────────────────────────────────────────────────────────────
exports.listUploads = async (req, res, next) => {
  try {
    const { type, status = 'active', seriesId } = req.query;
    const { page, limit } = pagination(req.query);

    const filter = { status };
    if (!req.admin.hasPermission('manageSettings')) {
      const scopes = [];
      if (req.admin.hasPermission('manageChapters')) scopes.push({ type: 'chapter_page' });
      if (req.admin.hasPermission('manageSeries')) scopes.push({ seriesId: { $exists: true }, type: { $ne: 'chapter_page' } });
      if (req.admin.hasPermission('manageHomepage')) scopes.push({ seriesId: { $exists: false }, type: { $in: ['cover', 'banner'] } });
      filter.$or = scopes;
    }
    if (type) filter.type = type;
    if (seriesId) filter.seriesId = seriesId;

    const total = await Upload.countDocuments(filter);
    const uploads = await Upload.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: uploads,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total, pages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
};

// ── Drive accounts summary ────────────────────────────────────────────────────
exports.getDriveAccounts = async (req, res, next) => {
  try {
    const accounts = await getDriveAccountsSummary();
    res.json({ success: true, data: accounts });
  } catch (err) { next(err); }
};
