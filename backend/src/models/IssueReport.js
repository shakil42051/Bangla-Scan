'use strict';
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  chapterNumber: { type: Number, min: 0 }, page: { type: Number, min: 1, max: 200 },
  reason: { type: String, enum: ['missing_pages', 'wrong_order', 'translation', 'broken_image', 'other'], required: true },
  details: { type: String, maxlength: 2000, default: '' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'dismissed'], default: 'open' },
}, { timestamps: true });
schema.index({ status: 1, createdAt: -1 });
module.exports = mongoose.model('IssueReport', schema);
