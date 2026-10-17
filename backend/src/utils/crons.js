'use strict';
const cron = require('node-cron');
const { publishScheduled } = require('../controllers/chapterController');
const DriveManager = require('../services/driveManager');
const Analytics = require('../models/Analytics');
const Series = require('../models/Series');
const logger = require('./logger');
const { dayKey } = require('./dates');

/**
 * Initialize all cron jobs.
 */
const initCrons = () => {
  const jobs = [];

  // ── Every minute: publish scheduled chapters ────────────────────────────────
  jobs.push(cron.schedule('* * * * *', async () => {
    try {
      await publishScheduled();
    } catch (err) {
      logger.error(`Cron [publishScheduled] error: ${err.message}`);
    }
  }, { timezone: process.env.SITE_TIMEZONE || 'Asia/Dhaka' }));

  // ── Every 15 minutes: Drive health check & auto-reconnect ───────────────────
  jobs.push(cron.schedule('*/15 * * * *', async () => {
    try {
      const results = await DriveManager.healthCheckAll();
      const failed  = results.filter((r) => r.status !== 'healthy');
      if (failed.length) {
        logger.warn(`[DriveHealthCron] ${failed.length} drive(s) unhealthy: ${failed.map((r) => r.name).join(', ')}`);
      } else {
        logger.info(`[DriveHealthCron] All ${results.length} drive(s) healthy.`);
      }
    } catch (err) {
      logger.error(`Cron [driveHealthCheck] error: ${err.message}`);
    }
  }, { timezone: process.env.SITE_TIMEZONE || 'Asia/Dhaka' }));

  // ── Daily at midnight: aggregate analytics ──────────────────────────────────
  jobs.push(cron.schedule('0 0 * * *', async () => {
    try {
      const yesterday = new Date(dayKey(new Date(Date.now() - 86400000)) + 'T00:00:00Z');

      const topSeries = await Series.find({ visibility: 'public' })
        .sort({ views: -1 }).limit(10).select('_id views').lean();

      await Analytics.findOneAndUpdate(
        { date: yesterday, type: 'daily' },
        { $set: { topSeries: topSeries.map((s) => ({ seriesId: s._id, views: s.views })) } },
        { upsert: true },
      );

      logger.info('Daily analytics aggregated.');
    } catch (err) {
      logger.error(`Cron [dailyAnalytics] error: ${err.message}`);
    }
  }, { timezone: process.env.SITE_TIMEZONE || 'Asia/Dhaka' }));

  logger.info('Cron jobs initialized.');
  return jobs;
};

module.exports = initCrons;
