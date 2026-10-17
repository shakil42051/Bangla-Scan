'use strict';
const mongoose = require('mongoose');

// A single document with key-value settings (singleton pattern)
const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },

  siteName: { type: String, default: 'Bangla Scan' },
  siteDescription: { type: String, default: 'Premium Manga & Manhwa Reading Platform' },
  siteUrl: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },

  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Site is under maintenance.' },
  broadcastMessage: { type: String, default: '' },

  allowRegistration: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: false },
  allowGuestReading: { type: Boolean, default: true },
  adultContentEnabled: { type: Boolean, default: false },

  downloadsEnabled: { type: Boolean, default: false },
  commentsEnabled: { type: Boolean, default: true },
  defaultReaderLayout: { type: String, enum: ['vertical', 'single', 'double'], default: 'vertical' },
  defaultTheme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  accentPalette: { type: String, enum: ['indigo', 'cyan', 'emerald', 'rose'], default: 'indigo' },
  supportEmail: { type: String, default: '' },
  homepageTitle: { type: String, maxlength: 100, default: 'One more chapter. A whole new world.' },
  homepageSubtitle: { type: String, maxlength: 300, default: 'Manga. Manhwa. Manhua. Comics. Your favorite panels, your language.' },
  footerTagline: { type: String, maxlength: 200, default: 'Manga. Manhwa. Manhua. Comics.' },
  defaultReaderWidth: { type: String, enum: ['fit', 'narrow', 'wide', 'original'], default: 'fit' },
  defaultReaderTone: { type: String, enum: ['dark', 'black', 'light', 'sepia'], default: 'dark' },
  defaultImageGap: { type: Boolean, default: false },
  storageDriver: { type: String, enum: ['local', 'drive', 's3'] },

  // Ads
  adsEnabled: { type: Boolean, default: false },
  adScript: { type: String, default: '' },

  // Social links
  social: {
    discord: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    telegram: { type: String, default: '' },
    patreon: { type: String, default: '' },
  },

  // SEO
  seo: {
    defaultMetaTitle: { type: String, default: 'Bangla Scan — Read Manga Online' },
    defaultMetaDescription: { type: String, default: '' },
    googleAnalyticsId: { type: String, default: '' },
    googleSiteVerification: { type: String, default: '' },
  },

  // Upload limits
  maxFileSizeMB: { type: Number, min: 1, max: 10, default: 10 },
  allowedImageTypes: { type: [String], default: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },

  // Cache TTL (seconds)
  cacheTTL: {
    seriesList: { type: Number, default: 300 },
    seriesDetail: { type: Number, default: 600 },
    chapterList: { type: Number, default: 300 },
  },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
