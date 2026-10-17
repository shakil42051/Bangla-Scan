'use strict';
const router = require('express').Router();
const Analytics = require('../models/Analytics');
const Series = require('../models/Series');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const { dayKey } = require('../utils/dates');
const { adminProtect, requirePermission } = require('../middleware/auth');

router.use(adminProtect, requirePermission('viewAnalytics'));

// Get analytics overview
router.get('/', async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      recentAnalytics,
      totalSeries, totalChapters, totalUsers,
      topSeries,
    ] = await Promise.all([
      Analytics.find({ date: { $gte: since }, type: 'daily' }).sort({ date: 1 }).lean(),
      Series.countDocuments(),
      Chapter.countDocuments(),
      User.countDocuments({ createdAt: { $gte: since } }),
      Series.find({ visibility: 'public' }).sort({ views: -1 }).limit(10).select('title views rating type coverImage').lean(),
    ]);

    res.json({
      success: true,
      data: {
        period, days,
        daily: recentAnalytics,
        totals: { series: totalSeries, chapters: totalChapters, newUsers: totalUsers },
        topSeries,
      },
    });
  } catch (err) { next(err); }
});

// Track a view event (lightweight — can be called from frontend)
router.post('/track', async (req, res, next) => {
  try {
    const today = new Date(dayKey() + 'T00:00:00Z');

    await Analytics.findOneAndUpdate(
      { date: today, type: 'daily' },
      { $inc: { pageViews: 1 } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
