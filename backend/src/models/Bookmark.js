'use strict';
const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  status: {
    type: String,
    enum: ['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'],
    default: 'plan_to_read',
  },
  lastChapterRead: { type: Number, default: 0 },
  score: { type: Number, min: 0, max: 10 },
}, { timestamps: true });

bookmarkSchema.index({ userId: 1, seriesId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, status: 1 });
bookmarkSchema.index({ seriesId: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
