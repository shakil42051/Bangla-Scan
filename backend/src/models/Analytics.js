'use strict';
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  pageViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  chaptersRead: { type: Number, default: 0 },
  seriesViews: { type: Number, default: 0 },
  topSeries: [{ seriesId: mongoose.Schema.Types.ObjectId, views: Number }],
  topChapters: [{ chapterId: mongoose.Schema.Types.ObjectId, views: Number }],
}, { timestamps: true });

analyticsSchema.index({ date: -1, type: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
