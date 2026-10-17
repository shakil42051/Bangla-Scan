'use strict';
const mongoose = require('mongoose');

// Flexible homepage section builder
const homepageSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['featured', 'latest', 'popular', 'genre', 'custom', 'banner', 'trending', 'upcoming'],
    required: true,
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // For 'genre' type
  genreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre' },

  // For 'custom' type — manually picked series
  seriesIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Series' }],

  // Display config
  displayStyle: {
    type: String,
    enum: ['grid', 'banner', 'hero', 'list'],
    default: 'grid',
  },
  limit: { type: Number, default: 10, max: 50 },
  badge: { type: String, default: '' }, // e.g. "HOT", "NEW"
  badgeColor: { type: String, default: '' },
  showViewAll: { type: Boolean, default: true },
  viewAllLink: { type: String, default: '' },

  // For banner type
  bannerImage: { fileId: String, driveId: String, url: String },
  bannerTitle: { type: String, default: '' },
  bannerSubtitle: { type: String, default: '' },
  bannerLink: { type: String, default: '' },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

homepageSectionSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
