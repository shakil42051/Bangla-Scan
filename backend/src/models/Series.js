'use strict';
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const slugify = require('slugify');

const seoSchema = new mongoose.Schema({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: [String],
  canonicalUrl: { type: String, default: '' },
}, { _id: false });

const seriesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  slug: { type: String, unique: true, lowercase: true },
  alternativeTitles: [{ type: String, trim: true }],
  description: { type: String, default: '', maxlength: 5000 },

  coverImage: { fileId: String, driveId: String, url: String },
  bannerImage: { fileId: String, driveId: String, url: String },

  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
  tags: [{ type: String, trim: true, lowercase: true }],

  author: { type: String, trim: true, default: '' },
  artist: { type: String, trim: true, default: '' },

  status: {
    type: String,
    enum: ['ongoing', 'completed', 'hiatus', 'cancelled', 'upcoming'],
    default: 'ongoing',
  },
  type: {
    type: String,
    enum: ['manga', 'manhwa', 'manhua', 'comic', 'webtoon'],
    default: 'manga',
  },
  releaseYear: { type: Number, min: 1900, max: 2100 },

  rating: { type: Number, default: 0, min: 0, max: 10 },
  ratingCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 },
  chapterCount: { type: Number, default: 0 },

  visibility: {
    type: String,
    enum: ['public', 'private', 'draft', 'scheduled'],
    default: 'draft',
  },
  publishAt: { type: Date }, // for scheduled publishing

  seoData: { type: seoSchema, default: () => ({}) },

  // Reading direction
  defaultReadingDirection: {
    type: String,
    enum: ['ltr', 'rtl', 'vertical'],
    default: function () { return this.type === 'manga' ? 'rtl' : this.type === 'comic' ? 'ltr' : 'vertical'; },
  },

  featuredOrder: { type: Number, default: 0 }, // for homepage ordering
  isAdultContent: { type: Boolean, default: false },
  language: { type: String, default: 'en' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
seriesSchema.index({ title: 'text', alternativeTitles: 'text', description: 'text' });
seriesSchema.index({ visibility: 1, type: 1, status: 1 });
seriesSchema.index({ views: -1 });
seriesSchema.index({ rating: -1 });
seriesSchema.index({ createdAt: -1 });
seriesSchema.index({ genres: 1 });
seriesSchema.index({ tags: 1 });
seriesSchema.index({ publishAt: 1, visibility: 1 });

// ── Auto-slug ─────────────────────────────────────────────────────────────────
seriesSchema.pre('save', async function (next) {
  if (!this.isModified('title') && this.slug) return next();
  let slug = slugify(this.title, { lower: true, strict: true, trim: true }) || String(this._id);
  // Ensure uniqueness
  const existing = await mongoose.model('Series').findOne({ slug, _id: { $ne: this._id } });
  if (existing) slug = `${slug}-${Date.now()}`;
  this.slug = slug;
  next();
});

seriesSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Series', seriesSchema);
