'use strict';
const router = require('express').Router();
const HomepageSection = require('../models/HomepageSection');
const UpcomingSeries = require('../models/UpcomingSeries');
const Series = require('../models/Series');
const { catalogFilter } = require('../middleware/contentAccess');
const { adminProtect, optionalAuth, requirePermission } = require('../middleware/auth');

// ── Public: render homepage data ─────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const publicFilter = { ...await catalogFilter(req), type: { $ne: 'novel' } };
    const sections = await HomepageSection.find({ isActive: true })
      .sort({ order: 1 })
      .populate('genreId', 'name slug')
      .lean();

    // Resolve each section's series
    const resolved = await Promise.all(sections.map(async (section) => {
      let series = [];

      if (section.type === 'custom' && section.seriesIds?.length > 0) {
        series = await Series.find({ _id: { $in: section.seriesIds }, ...publicFilter })
          .populate('genres', 'name slug color')
          .lean();
      } else if (section.type === 'latest') {
        series = await Series.find({ ...publicFilter })
          .sort({ createdAt: -1 }).limit(section.limit || 10)
          .populate('genres', 'name slug color').lean();
      } else if (section.type === 'popular' || section.type === 'trending') {
        series = await Series.find({ ...publicFilter })
          .sort({ views: -1 }).limit(section.limit || 10)
          .populate('genres', 'name slug color').lean();
      } else if (section.type === 'featured') {
        series = await Series.find({ ...publicFilter, featuredOrder: { $gt: 0 } })
          .sort({ featuredOrder: 1 }).limit(section.limit || 10)
          .populate('genres', 'name slug color').lean();
      } else if (section.type === 'genre' && section.genreId) {
        series = await Series.find({ ...publicFilter, genres: section.genreId._id })
          .sort({ views: -1 }).limit(section.limit || 10)
          .populate('genres', 'name slug color').lean();
      } else if (section.type === 'upcoming') {
        const upcoming = await UpcomingSeries.find({ isActive: true })
          .sort({ order: 1 }).limit(section.limit || 10)
          .populate('genres', 'name slug').lean();
        return { ...section, upcoming };
      }

      return { ...section, series };
    }));

    res.json({ success: true, data: resolved });
  } catch (err) { next(err); }
});

// ── Admin: CRUD sections ──────────────────────────────────────────────────────
router.get('/sections', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    const sections = await HomepageSection.find().sort({ order: 1 }).lean();
    res.json({ success: true, data: sections });
  } catch (err) { next(err); }
});

router.post('/sections', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    const section = await HomepageSection.create({ ...req.body, updatedBy: req.admin._id });
    res.status(201).json({ success: true, data: section });
  } catch (err) { next(err); }
});

router.put('/sections/:id', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    const section = await HomepageSection.findByIdAndUpdate(
      req.params.id, { ...req.body, updatedBy: req.admin._id }, { new: true, runValidators: true }
    );
    if (!section) return res.status(404).json({ success: false, message: 'Section not found.' });
    res.json({ success: true, data: section });
  } catch (err) { next(err); }
});

router.delete('/sections/:id', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    await HomepageSection.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Section deleted.' });
  } catch (err) { next(err); }
});

// Reorder sections
router.post('/sections/reorder', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    const { orders } = req.body; // [{ id, order }]
    await Promise.all(orders.map(({ id, order }) =>
      HomepageSection.findByIdAndUpdate(id, { order })
    ));
    res.json({ success: true, message: 'Sections reordered.' });
  } catch (err) { next(err); }
});

// Upcoming series CRUD
router.get('/upcoming', optionalAuth, async (req, res, next) => {
  try {
    const upcoming = await UpcomingSeries.find(req.isAdmin ? {} : { isActive: true }).sort({ order: 1 }).populate('genres', 'name slug').lean();
    res.json({ success: true, data: upcoming });
  } catch (err) { next(err); }
});

router.post('/upcoming', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    const item = await UpcomingSeries.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.put('/upcoming/:id', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    const item = await UpcomingSeries.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/upcoming/:id', adminProtect, requirePermission('manageHomepage'), async (req, res, next) => {
  try {
    await UpcomingSeries.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
