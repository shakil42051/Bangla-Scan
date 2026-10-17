'use strict';
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { pagination } = require('../utils/http');
const Activity = require('../models/ReadActivity');
router.use(protect, (req, res, next) => req.isAdmin ? res.status(403).json({ success: false, message: 'Use a reader account for personal reading features.' }) : next());
router.get('/history', async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query); const filter = { userId: req.user._id };
    const visible = await require('../middleware/contentAccess').catalogFilter(req);
    const [data, total] = await Promise.all([Activity.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).populate({ path: 'seriesId', match: visible, select: 'title coverImage type slug' }).populate({ path: 'chapterId', match: { visibility: 'public' }, select: 'chapterNumber title' }).lean(), Activity.countDocuments(filter)]);
    res.json({ success: true, data, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});
module.exports = router;
