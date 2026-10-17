'use strict';
const router = require('express').Router();
const { pagination } = require('../utils/http');
router.use((req, res, next) => { const bounded = pagination(req.query); req.query.page = String(bounded.page); req.query.limit = String(bounded.limit); next(); });
const Genre = require('../models/Genre');
const Series = require('../models/Series');
const { catalogFilter } = require('../middleware/contentAccess');
const { adminProtect, optionalAuth, requirePermission } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// Get all genres (public)
router.get('/', async (req, res, next) => {
  try {
    const genres = await Genre.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, data: genres });
  } catch (err) { next(err); }
});

router.get('/:slug/series', optionalAuth, async (req, res, next) => {
  try {
    const genre = await Genre.findOne({ slug: req.params.slug });
    if (!genre) return res.status(404).json({ success: false, message: 'Genre not found.' });

    const { page = 1, limit = 20 } = req.query;
    const result = await Series.paginate(
      { genres: genre._id, ...await catalogFilter(req) },
      { page: parseInt(page), limit: parseInt(limit), sort: { views: -1 }, populate: [{ path: 'genres', select: 'name slug' }], lean: true }
    );
    res.json({ success: true, data: result.docs, genre, pagination: { page: result.page, total: result.totalDocs, pages: result.totalPages } });
  } catch (err) { next(err); }
});

// Admin CRUD
router.post('/', adminProtect, requirePermission('manageSeries'), [
  body('name').trim().notEmpty(),
  body('icon').optional().trim(),
  body('color').optional().trim(),
], validate, async (req, res, next) => {
  try {
    const genre = await Genre.create(req.body);
    res.status(201).json({ success: true, data: genre });
  } catch (err) { next(err); }
});

router.put('/:id', adminProtect, requirePermission('manageSeries'), async (req, res, next) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!genre) return res.status(404).json({ success: false, message: 'Genre not found.' });
    res.json({ success: true, data: genre });
  } catch (err) { next(err); }
});

router.delete('/:id', adminProtect, requirePermission('manageSeries'), async (req, res, next) => {
  try {
    await Genre.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Genre deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
