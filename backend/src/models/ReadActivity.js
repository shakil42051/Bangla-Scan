'use strict';
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  day: { type: String, required: true },
  pages: [{ type: Number, min: 1 }],
  completed: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ userId: 1, chapterId: 1, day: 1 }, { unique: true });
schema.index({ userId: 1, updatedAt: -1 });
module.exports = mongoose.model('ReadActivity', schema);
