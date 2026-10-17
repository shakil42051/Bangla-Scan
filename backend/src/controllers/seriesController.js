'use strict';
const { body, query } = require('express-validator');
const Series = require('../models/Series');
const Chapter = require('../models/Chapter');
const Bookmark = require('../models/Bookmark');
const Rating = require('../models/Rating');
const logger = require('../utils/logger');
const { pagination } = require('../utils/http');
const { catalogFilter, canPreview } = require('../middleware/contentAccess');

// ── List Series ───────────────────────────────────────────────────────────────
exports.listSeries = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      type, status, genre, tag,
      sort = '-createdAt',
      q, visibility = 'public',
    } = req.query;

    const filter = {};

    // Only public content unless admin
    if (!canPreview(req)) {
      Object.assign(filter, await catalogFilter(req));
    } else if (visibility !== 'all') {
      filter.visibility = visibility;
    }

    if (type) filter.type = type;
    else if (!req.isAdmin) filter.type = { $ne: 'novel' };
    if (req.query.language) filter.language = String(req.query.language).slice(0, 8);
    if (Number(req.query.minRating) > 0) filter.rating = { $gte: Math.min(10, Number(req.query.minRating)) };
    if (Number(req.query.year) >= 1900) filter.releaseYear = Number(req.query.year);
    if (status) filter.status = status;
    if (genre) filter.genres = genre;
    if (tag) filter.tags = tag.toLowerCase();
    if (q) { const text = String(q).slice(0, 150).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ title: new RegExp(text, 'i') }, { author: new RegExp(text, 'i') }, { artist: new RegExp(text, 'i') }, { alternativeTitles: new RegExp(text, 'i') }]; }

    const allowedSorts = {
      '-createdAt': { createdAt: -1 },
      '-views': { views: -1 },
      '-bookmarkCount': { bookmarkCount: -1 },
      '-rating': { rating: -1 },
      '-chapterCount': { chapterCount: -1 },
      title: { title: 1 },
      '-updatedAt': { updatedAt: -1 },
    };

    const sortObj = allowedSorts[sort] || { createdAt: -1 };

    const options = {
      ...pagination(req.query, 50),
      sort: sortObj,
      populate: [{ path: 'genres', select: 'name slug color icon' }],
      select: '-seoData',
      lean: true,
    };

    const result = await Series.paginate(filter, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      },
    });
  } catch (err) { next(err); }
};

// ── Get single series by slug or ID ──────────────────────────────────────────
exports.getSeries = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    if (!canPreview(req)) Object.assign(filter, await catalogFilter(req));

    const series = await Series.findOne(filter)
      .populate('genres', 'name slug color icon')
      .populate('createdBy', 'name');

    if (!series) {
      return res.status(404).json({ success: false, message: 'Series not found.' });
    }

    // Increment views (non-blocking)
    Series.findByIdAndUpdate(series._id, { $inc: { views: 1 } }).exec().catch(err => logger.warn(err.message));

    // Attach user-specific data if logged in
    let userBookmark = null;
    let userRating = null;
    if (req.user && !req.isAdmin) {
      [userBookmark, userRating] = await Promise.all([
        Bookmark.findOne({ userId: req.user._id, seriesId: series._id }).lean(),
        Rating.findOne({ userId: req.user._id, seriesId: series._id }).lean(),
      ]);
    }

    res.json({
      success: true,
      data: { series, userBookmark, userRating },
    });
  } catch (err) { next(err); }
};

// ── Create series (admin) ─────────────────────────────────────────────────────
exports.createSeriesValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 300 }),
  body('type').optional().isIn(['manga', 'manhwa', 'manhua', 'comic', 'webtoon']),
  body('status').optional().isIn(['ongoing', 'completed', 'hiatus', 'cancelled', 'upcoming']),
  body('visibility').optional().isIn(['public', 'private', 'draft', 'scheduled']),
];

exports.createSeries = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.admin._id };
    const series = await Series.create(data);
    res.status(201).json({ success: true, message: 'Series created.', data: series });
  } catch (err) { next(err); }
};

// ── Update series (admin) ─────────────────────────────────────────────────────
exports.updateSeries = async (req, res, next) => {
  try {
    const series = await Series.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.admin._id },
      { new: true, runValidators: true }
    );
    if (!series) return res.status(404).json({ success: false, message: 'Series not found.' });
    res.json({ success: true, message: 'Series updated.', data: series });
  } catch (err) { next(err); }
};

// ── Delete series (admin) ─────────────────────────────────────────────────────
exports.deleteSeries = async (req, res, next) => {
  try {
    const series = await Series.findByIdAndDelete(req.params.id);
    if (!series) return res.status(404).json({ success: false, message: 'Series not found.' });

    // Cascade: delete chapters (pages cleanup should be done separately via job)
    await Chapter.deleteMany({ seriesId: req.params.id });

    res.json({ success: true, message: 'Series and chapters deleted.' });
  } catch (err) { next(err); }
};

// ── Search autocomplete ───────────────────────────────────────────────────────
exports.search = async (req, res, next) => {
  try {
    const { q = '', limit = 10 } = req.query;
    if (!q.trim()) return res.json({ success: true, data: [] });

    const results = await Series.find(
      { $text: { $search: String(q).slice(0, 150) }, ...await catalogFilter(req) },
      { score: { $meta: 'textScore' }, title: 1, slug: 1, coverImage: 1, type: 1, status: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.min(20, parseInt(limit)))
      .lean();

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};
