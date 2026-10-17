'use strict';
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  score: { type: Number, required: true, min: 1, max: 10 },
  review: { type: String, default: '', maxlength: 3000 },
}, { timestamps: true });

ratingSchema.index({ userId: 1, seriesId: 1 }, { unique: true });
ratingSchema.index({ seriesId: 1 });

module.exports = mongoose.model('Rating', ratingSchema);
