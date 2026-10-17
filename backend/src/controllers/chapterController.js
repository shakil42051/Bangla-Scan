'use strict';
const { body } = require('express-validator');
const Chapter = require('../models/Chapter');
const Series = require('../models/Series');
const logger = require('../utils/logger');
const { readableSeries, canPreview } = require('../middleware/contentAccess');
const { pagination } = require('../utils/http');
const notifyPublished = require('../services/chapterNotifications');

// ── List chapters for a series ────────────────────────────────────────────────
exports.listChapters = async (req, res, next) => {
  try {
    const { seriesId } = req.params;
    await readableSeries(req, seriesId, false);
    const { page = 1, limit = 50, sort = '-chapterNumber' } = req.query;

    const filter = { seriesId };
    if (!canPreview(req, true)) filter.visibility = 'public';

    const allowedSorts = {
      '-chapterNumber': { chapterNumber: -1 },
      chapterNumber: { chapterNumber: 1 },
      '-createdAt': { createdAt: -1 },
    };
    const sortObj = allowedSorts[sort] || { chapterNumber: -1 };

    const options = {
      ...pagination(req.query),
      sort: sortObj,
      select: '-pages', // don't return all pages in list (heavy)
      lean: true,
    };

    const result = await Chapter.paginate(filter, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        page: result.page, limit: result.limit,
        total: result.totalDocs, pages: result.totalPages,
        hasNext: result.hasNextPage, hasPrev: result.hasPrevPage,
      },
    });
  } catch (err) { next(err); }
};

// ── Get single chapter with pages ─────────────────────────────────────────────
exports.getChapter = async (req, res, next) => {
  try {
    const { seriesId, chapterNumber } = req.params;
    await readableSeries(req, seriesId);

    const filter = { seriesId, chapterNumber: parseFloat(chapterNumber) };
    if (!canPreview(req, true)) filter.visibility = 'public';

    const chapter = await Chapter.findOne(filter).populate('uploader', 'name');
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }

    // Check scheduled publish
    if (chapter.visibility === 'scheduled' && chapter.publishAt && new Date() < chapter.publishAt) {
      if (!canPreview(req, true)) {
        return res.status(404).json({ success: false, message: 'Chapter not yet available.' });
      }
    }

    // Increment views (non-blocking)
    Chapter.findByIdAndUpdate(chapter._id, { $inc: { views: 1 } }).exec().catch(err => logger.warn(err.message));

    // Get prev/next chapter numbers
    const [prev, next] = await Promise.all([
      Chapter.findOne({ seriesId, chapterNumber: { $lt: chapter.chapterNumber }, visibility: 'public' })
        .sort({ chapterNumber: -1 }).select('chapterNumber title').lean(),
      Chapter.findOne({ seriesId, chapterNumber: { $gt: chapter.chapterNumber }, visibility: 'public' })
        .sort({ chapterNumber: 1 }).select('chapterNumber title').lean(),
    ]);

    res.json({ success: true, data: { chapter, prev, next } });
  } catch (err) { next(err); }
};

// ── Get single chapter by ID (admin) ──────────────────────────────────────────
exports.getChapterById = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('uploader', 'name');
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }
    res.json({ success: true, data: chapter });
  } catch (err) { next(err); }
};

// ── Create chapter (admin) ────────────────────────────────────────────────────
exports.createChapterValidation = [
  body('seriesId').isMongoId().withMessage('Valid series ID required'),
  body('chapterNumber').isFloat({ min: 0 }).withMessage('Chapter number required'),
  body('visibility').optional().isIn(['public', 'private', 'draft', 'scheduled']),
];

exports.createChapter = async (req, res, next) => {
  try {
    const { seriesId, chapterNumber, title, visibility, pages, readingDirection, publishAt, notes } = req.body;

    if ((pages !== undefined && (!Array.isArray(pages) || pages.length)) || visibility === 'public') return res.status(400).json({ success: false, message: 'Create a draft chapter, upload its comic pages, then publish it.' });

    // Check series exists
    const series = await Series.findById(seriesId);
    if (!series) return res.status(404).json({ success: false, message: 'Series not found.' });

    // Check duplicate
    const exists = await Chapter.findOne({ seriesId, chapterNumber });
    if (exists) return res.status(409).json({ success: false, message: `Chapter ${chapterNumber} already exists.` });

    const chapter = await Chapter.create({
      seriesId, chapterNumber, title, visibility,
      pages: [],
      readingDirection: readingDirection || series.defaultReadingDirection,
      publishAt: publishAt ? new Date(publishAt) : undefined,
      uploader: req.admin._id,
      notes,
    });

    // Update series chapter count
    await Series.findByIdAndUpdate(seriesId, { $inc: { chapterCount: 1 }, updatedAt: new Date() });

    await notifyPublished(chapter).catch(error => logger.warn('Chapter notification delivery deferred: ' + error.message));
    res.status(201).json({ success: true, message: 'Chapter created.', data: chapter });
  } catch (err) { next(err); }
};

// ── Update chapter (admin) ────────────────────────────────────────────────────
exports.updateChapter = async (req, res, next) => {
  try {
    const allowed = ['title', 'chapterNumber', 'visibility', 'pages', 'readingDirection', 'publishAt', 'notes', 'volume', 'externalUrl'];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    if (update.pages !== undefined || update.visibility === 'public') {
      const original = await Chapter.findById(req.params.id);
      if (!original) return res.status(404).json({ success: false, message: 'Chapter not found.' });
      if (update.pages !== undefined) {
        if (!Array.isArray(update.pages) || update.pages.length > 200 || update.pages.some(p => !p || typeof p !== 'object') || new Set(update.pages.map(p => p.fileId)).size !== update.pages.length) return res.status(400).json({ success: false, message: 'Choose up to 200 distinct uploaded chapter pages.' });
        const existing = new Map(original.pages.map(p => [p.fileId, p]));
        if (update.pages.some(p => !existing.has(p.fileId))) return res.status(400).json({ success: false, message: 'Upload new pages through the chapter upload tool first.' });
        update.pages = update.pages.map((p, i) => ({ ...(existing.get(p.fileId).toObject?.() || existing.get(p.fileId)), order: i + 1 }));
        update.pageCount = update.pages.length;
      }
      if ((update.visibility || original.visibility) === 'public' && !(update.pages || original.pages).length) return res.status(400).json({ success: false, message: 'Upload comic pages before publishing this chapter.' });
    }
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });

    await Series.findByIdAndUpdate(chapter.seriesId, { updatedAt: new Date() });
    if (req.body.visibility === 'public') await notifyPublished(chapter).catch(error => logger.warn(error.message));
    res.json({ success: true, message: 'Chapter updated.', data: chapter });
  } catch (err) { next(err); }
};

// ── Delete chapter (admin) ────────────────────────────────────────────────────
exports.deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });

    // Decrement series chapter count
    await Series.findByIdAndUpdate(chapter.seriesId, { $inc: { chapterCount: -1 } });

    res.json({ success: true, message: 'Chapter deleted.' });
  } catch (err) { next(err); }
};

// ── Bulk publish scheduled chapters (called by cron job) ─────────────────────
exports.publishScheduled = async () => {
  const now = new Date();
  const due = await Chapter.find({ visibility: 'scheduled', publishAt: { $lte: now }, 'pages.0': { $exists: true } });
  const result = await Chapter.updateMany(
    { visibility: 'scheduled', publishAt: { $lte: now }, 'pages.0': { $exists: true } },
    { $set: { visibility: 'public' } }
  );
  await Series.updateMany({ visibility: 'scheduled', publishAt: { $lte: now } }, { $set: { visibility: 'public' } });
  await Promise.allSettled(due.map(chapter => notifyPublished({ ...chapter.toObject(), visibility: 'public' })));
  if (result.modifiedCount > 0) {
    logger.info(`Published ${result.modifiedCount} scheduled chapters.`);
  }
};
