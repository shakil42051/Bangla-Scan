'use strict';
const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Chapter = require('../models/Chapter');
const Activity = require('../models/ReadActivity');
const { dayKey } = require('../utils/dates');
const { progressPipeline } = require('../utils/progress');
const { readableSeries } = require('../middleware/contentAccess');

router.use(protect, (req, res, next) => req.isAdmin ? res.status(403).json({ success: false, message: 'Use an individual reader account for your library.' }) : next());

// Get profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -refreshTokenHash -googleId')
      .lean();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Update profile
router.put('/profile', [
  body('bio').optional().isLength({ max: 500 }),
  body('name').optional().trim().isLength({ min: 1, max: 80 }),
  body('preferences').optional().custom(require('../services/readerPreferences')).withMessage('Choose valid reader preferences.'),
  body('avatar').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }).isLength({ max: 2000 }),
  body('preferences.theme').optional().isIn(['dark', 'light', 'system']),
  body('preferences.readingDirection').optional().isIn(['ltr', 'rtl', 'vertical']),
  body('preferences.timezone').optional().custom(value => { new Intl.DateTimeFormat('en', { timeZone: value }); return true; }),
], validate, async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'avatar', 'preferences'];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined && k !== 'preferences') update[k] = req.body[k]; });
    for (const [key, value] of Object.entries(req.body.preferences || {})) update['preferences.' + key] = value;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true })
      .select('-passwordHash -refreshTokenHash -googleId');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Update reading progress
router.post('/reading-progress', [
  body('seriesId').isMongoId(), body('chapterId').isMongoId(),
  body('pagesViewed').optional().isArray({ max: 200 }),
  body('pagesViewed.*').optional().isInt({ min: 1 }),
  body('page').isInt({ min: 1 }), body('completion').isFloat({ min: 0, max: 100 }),
], validate, async (req, res, next) => {
  try {
    const { seriesId, chapterId } = req.body;
    await readableSeries(req, seriesId);
    const chapter = await Chapter.findOne({ _id: chapterId, seriesId, visibility: 'public' });
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });
    const page = Number(req.body.page);
    if (page > Math.max(1, chapter.pages.length)) return res.status(400).json({ success: false, message: 'Page is outside this chapter.' });
    const viewed = [...new Set([...(req.body.pagesViewed || []), page].map(Number))];
    if (viewed.some(p => p > chapter.pages.length)) return res.status(400).json({ success: false, message: 'Viewed page is outside this chapter.' });
    const entry = { seriesId, chapterId, chapterNumber: chapter.chapterNumber, page, completion: Number(req.body.completion) };
    await User.findByIdAndUpdate(req.user._id, progressPipeline(entry));
    if (req.user.preferences?.recordHistory !== false) await Activity.updateOne({ userId: req.user._id, chapterId, day: dayKey(new Date(), req.user.preferences?.timezone || 'Asia/Dhaka') }, { $set: { seriesId, ...(page === chapter.pages.length ? { completed: true } : {}) }, $addToSet: { pages: { $each: viewed } } }, { upsert: true, setDefaultsOnInsert: true });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// Get reading progress for a series
router.get('/reading-progress/:seriesId', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('readingProgress').lean();
    const progress = user?.readingProgress?.find((p) => p.seriesId.toString() === req.params.seriesId);
    res.json({ success: true, data: progress || null });
  } catch (err) { next(err); }
});

// Both reader and content-team password changes use the same MFA/CAS checks.
router.post('/change-password', require('../services/accountSecurity').changePassword);

module.exports = router;
