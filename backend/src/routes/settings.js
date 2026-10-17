'use strict';
const router = require('express').Router();
const Settings = require('../models/Settings');
const { adminProtect, optionalAuth, requirePermission } = require('../middleware/auth');
const { body } = require('express-validator');

// Get public settings
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    let settings = await Settings.findById('global').lean();
    if (!settings) settings = new Settings({ _id: 'global' }).toObject();
    // Remove sensitive data for non-admin
    if (!req.isAdmin || !req.admin.hasPermission('manageSettings')) {
      delete settings.adScript;
      delete settings.storageDriver;
      delete settings.updatedBy;
    }
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// Update settings (admin only)
router.put('/', adminProtect, requirePermission('manageSettings'), [
  ...['siteName', 'siteDescription', 'broadcastMessage', 'maintenanceMessage', 'homepageTitle', 'homepageSubtitle', 'footerTagline'].map(key => body(key).optional().isString().isLength({ max: key === 'siteName' ? 80 : 1000 })),
  ...['downloadsEnabled', 'commentsEnabled', 'defaultImageGap', 'maintenanceMode', 'allowRegistration', 'requireEmailVerification', 'allowGuestReading', 'adultContentEnabled'].map(key => body(key).optional().isBoolean({ strict: true })),
  body('maxFileSizeMB').optional().isFloat({ min: 1, max: 10 }),
  body('allowedImageTypes').optional().isArray({ min: 1, max: 4 }),
  body('allowedImageTypes.*').optional().isIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  body('social').optional().isObject(), body('seo').optional().isObject(),
  ...['logoUrl', 'faviconUrl'].map(key => body(key).optional({ values: 'falsy' }).custom(value => typeof value === 'string' && value.length < 2000 && (/^\/api\/media\/[A-Za-z0-9_-]+$/.test(value) || /^https?:\/\//.test(value)))),
  body('siteUrl').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('supportEmail').optional({ values: 'falsy' }).isEmail(),
], require('../middleware/validate'), async (req, res, next) => {
  try {
    const allowed = [
      'downloadsEnabled', 'commentsEnabled', 'defaultReaderLayout', 'defaultTheme', 'accentPalette', 'supportEmail', 'siteName', 'siteDescription', 'siteUrl', 'logoUrl', 'faviconUrl',
      'maintenanceMode', 'maintenanceMessage', 'broadcastMessage', 'allowRegistration',
      'requireEmailVerification', 'allowGuestReading', 'adultContentEnabled',
      'homepageTitle', 'homepageSubtitle', 'footerTagline', 'defaultReaderWidth', 'defaultReaderTone', 'defaultImageGap',
      'social', 'seo', 'maxFileSizeMB', 'allowedImageTypes',
    ];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedBy = req.admin._id;
    if (update.requireEmailVerification && !require('../services/mailer').configured()) return res.status(400).json({ success: false, message: 'Configure SMTP before requiring email verification.' });

    const settings = await Settings.findByIdAndUpdate('global', { $set: update }, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

module.exports = router;
