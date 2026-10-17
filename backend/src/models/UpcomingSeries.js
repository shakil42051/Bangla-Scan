'use strict';
const mongoose = require('mongoose');

const upcomingSeriesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  coverImage: { fileId: String, driveId: String, url: String },
  description: { type: String, default: '' },
  type: { type: String, enum: ['manga', 'manhwa', 'manhua', 'comic', 'webtoon'], default: 'manga' },
  expectedDate: { type: Date },
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

upcomingSeriesSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('UpcomingSeries', upcomingSeriesSchema);
