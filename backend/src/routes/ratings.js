'use strict';
const router = require('express').Router();
const { pagination } = require('../utils/http');
router.use((req, res, next) => { const bounded = pagination(req.query); req.query.page = String(bounded.page); req.query.limit = String(bounded.limit); next(); });
const Rating = require('../models/Rating');
const Series = require('../models/Series');
const { protect, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { readableSeries } = require('../middleware/contentAccess');

// Get ratings for a series
router.get('/series/:seriesId', optionalAuth, async (req, res, next) => {
  try {
    await readableSeries(req, req.params.seriesId, false);
    const { page = 1, limit = 20 } = req.query;
    const total = await Rating.countDocuments({ seriesId: req.params.seriesId });
    const ratings = await Rating.find({ seriesId: req.params.seriesId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'username avatar')
      .lean();
    res.json({ success: true, data: ratings, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// Rate a series
router.post('/', protect, [
  body('seriesId').isMongoId(),
  body('score').isFloat({ min: 1, max: 10 }),
  body('review').optional().isLength({ max: 3000 }),
], validate, async (req, res, next) => {
  try {
    const { seriesId, score, review } = req.body;
    await readableSeries(req, seriesId, false);

    const rating = await Rating.findOneAndUpdate(
      { userId: req.user._id, seriesId },
      { score, review },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recalculate series average rating
    const agg = await Rating.aggregate([
      { $match: { seriesId: rating.seriesId } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);
    if (agg.length > 0) {
      await Series.findByIdAndUpdate(seriesId, {
        rating: Math.round(agg[0].avg * 10) / 10,
        ratingCount: agg[0].count,
      });
    }

    res.json({ success: true, data: rating });
  } catch (err) { next(err); }
});

// Delete rating
router.delete('/:seriesId', protect, async (req, res, next) => {
  try {
    await Rating.findOneAndDelete({ userId: req.user._id, seriesId: req.params.seriesId });

    const agg = await Rating.aggregate([
      { $match: { seriesId: require('mongoose').Types.ObjectId.createFromHexString(req.params.seriesId) } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);
    const avg = agg.length > 0 ? agg[0].avg : 0;
    const count = agg.length > 0 ? agg[0].count : 0;
    await Series.findByIdAndUpdate(req.params.seriesId, { rating: Math.round(avg * 10) / 10, ratingCount: count });

    res.json({ success: true, message: 'Rating removed.' });
  } catch (err) { next(err); }
});

module.exports = router;
