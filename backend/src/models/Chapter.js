'use strict';
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const pageSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  fileId: { type: String, required: true },
  driveId: { type: String, required: true }, // which drive account
  url: { type: String, required: true },    // public/direct URL
  width: Number,
  height: Number,
  size: Number, // bytes
}, { _id: false });

const chapterSchema = new mongoose.Schema({
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true,
    index: true,
  },
  chapterNumber: { type: Number, required: true },
  volume: { type: Number },
  title: { type: String, trim: true, default: '' },

  pages: [pageSchema],
  pageCount: { type: Number, default: 0 },

  readingDirection: {
    type: String,
    enum: ['ltr', 'rtl', 'vertical'],
    default: 'ltr',
  },

  views: { type: Number, default: 0 },
  visibility: {
    type: String,
    enum: ['public', 'private', 'draft', 'scheduled'],
    default: 'draft',
  },
  publishAt: { type: Date },

  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // External chapter link (scanlation group mirror)
  externalUrl: { type: String, default: '' },

  notes: { type: String, default: '', maxlength: 1000 }, // translator notes
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
chapterSchema.index({ seriesId: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ seriesId: 1, visibility: 1, chapterNumber: -1 });
chapterSchema.index({ publishAt: 1, visibility: 1 });
chapterSchema.index({ createdAt: -1 });

// ── Pre-save: update pageCount ────────────────────────────────────────────────
chapterSchema.pre('save', function (next) {
  this.pageCount = this.pages ? this.pages.length : 0;
  next();
});

chapterSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Chapter', chapterSchema);
