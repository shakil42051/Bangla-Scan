'use strict';
const router = require('express').Router();
const { pagination } = require('../utils/http');
router.use((req, res, next) => { const bounded = pagination(req.query); req.query.page = String(bounded.page); req.query.limit = String(bounded.limit); next(); });
const Bookmark = require('../models/Bookmark');
const Series = require('../models/Series');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { readableSeries } = require('../middleware/contentAccess');
const validate = require('../middleware/validate');

router.use(protect, (req, res, next) => req.isAdmin ? res.status(403).json({ success: false, message: 'Use a reader account for personal collections.' }) : next());

// Get user's bookmarks
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const total = await Bookmark.countDocuments(filter);
    const bookmarks = await Bookmark.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({ path: 'seriesId', match: await require('../middleware/contentAccess').catalogFilter(req), select: 'title slug coverImage type status chapterCount rating' })
      .lean();

    res.json({ success: true, data: bookmarks, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// Add/update bookmark
router.post('/', [
  body('seriesId').isMongoId(),
  body('lastChapterRead').optional().isFloat({ min: 0 }),
  body('score').optional().isFloat({ min: 0, max: 10 }),
  body('status').isIn(['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped']),
], validate, async (req, res, next) => {
  try {
    const { seriesId, status, lastChapterRead, score } = req.body;

    await readableSeries(req, seriesId, false);

    const bookmark = await Bookmark.findOneAndUpdate(
      { userId: req.user._id, seriesId },
      { status, lastChapterRead, score },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    // Update series bookmark count
    await Series.findByIdAndUpdate(seriesId, { bookmarkCount: await Bookmark.countDocuments({ seriesId }) });

    res.json({ success: true, data: bookmark });
  } catch (err) { next(err); }
});

// Remove bookmark
router.delete('/:seriesId', async (req, res, next) => {
  try {
    const result = await Bookmark.findOneAndDelete({ userId: req.user._id, seriesId: req.params.seriesId });
    if (result) {
      await Series.findByIdAndUpdate(req.params.seriesId, { bookmarkCount: await Bookmark.countDocuments({ seriesId: req.params.seriesId }) });
    }
    res.json({ success: true, message: 'Bookmark removed.' });
  } catch (err) { next(err); }
});

module.exports = router;
