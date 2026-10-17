'use strict';
const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#7c3aed' },
  seriesCount: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

genreSchema.index({ isActive: 1, order: 1 });

const slugify = require('slugify');
genreSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) || String(this._id);
  }
  next();
});

module.exports = mongoose.model('Genre', genreSchema);
