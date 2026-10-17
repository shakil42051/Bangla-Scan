'use strict';
const Series = require('../models/Series');
const Settings = require('../models/Settings');
const { fail } = require('../utils/http');

// Validate the parent as well as the chapter. Knowing a chapter ID never grants access.
const canPreview = (req, chapters = false) => Boolean(req.isAdmin && req.admin && (chapters ? req.admin.hasPermission('manageChapters') : ['manageSeries', 'manageChapters', 'manageHomepage'].some(permission => req.admin.hasPermission(permission))));
const readableSeries = async (req, seriesId, requireReading = true) => {
  const series = await Series.findById(seriesId);
  const preview = canPreview(req, requireReading);
  if (!series || (!preview && series.visibility !== 'public')) throw fail(404, 'Series not found.');
  if (preview) return series;
  const settings = await Settings.findById('global').lean() || {};
  if (settings.maintenanceMode) throw fail(503, settings.maintenanceMessage || 'Maintenance in progress.');
  if (requireReading && settings.allowGuestReading === false && (!req.user || req.isAdmin)) throw fail(401, 'Sign in to read this chapter.');
  if (requireReading && settings.requireEmailVerification && req.user && !req.user.isEmailVerified) throw fail(403, 'Verify your email before reading.');
  if (series.isAdultContent && (!settings.adultContentEnabled || !req.user?.preferences?.showAdultContent)) throw fail(404, 'Series not found.');
  return series;
};
const catalogFilter = async req => {
  const settings = await Settings.findById('global').lean() || {};
  const filter = { visibility: 'public' };
  if (!canPreview(req) && (!settings.adultContentEnabled || !req.user?.preferences?.showAdultContent)) filter.isAdultContent = { $ne: true };
  return filter;
};
module.exports = { readableSeries, catalogFilter, canPreview };
