'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mongoosePaginate = require('mongoose-paginate-v2');

const readProgressSchema = new mongoose.Schema({
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  chapterNumber: Number,
  page: { type: Number, default: 1, min: 1 },
  completion: { type: Number, default: 0, min: 0, max: 100 },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80 },
  username: {
    type: String, required: true, unique: true, trim: true,
    minlength: 3, maxlength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscore'],
  },
  email: {
    type: String, required: true, unique: true, lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  passwordHash: { type: String, select: false },

  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 500 },

  role: { type: String, enum: ['user', 'moderator'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },

  // OAuth providers
  googleId: { type: String, select: false },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },

  // Reading preferences
  preferences: {
    accentPalette: { type: String, enum: ['site', 'indigo', 'cyan', 'emerald', 'rose'], default: 'site' },
    textSize: { type: String, enum: ['small', 'normal', 'large'], default: 'normal' },
    highContrast: { type: Boolean, default: false },
    reduceMotion: { type: Boolean, default: false },
    dataSaver: { type: Boolean, default: false },
    recordHistory: { type: Boolean, default: true },
    moreLinks: { type: [String], enum: ['saved-pages', 'wishlist', 'history', 'notifications', 'rankings', 'genres', 'community'], default: undefined },
    theme: { type: String, default: 'dark' },
    readingDirection: { type: String, enum: ['ltr', 'rtl', 'vertical'], default: 'ltr' },
    autoNextChapter: { type: Boolean, default: true },
    showAdultContent: { type: Boolean, default: false },
    language: { type: String, default: 'bn' },
    timezone: { type: String, default: 'Asia/Dhaka' },
    fitWidth: { type: Boolean, default: true },
    readerLayout: { type: String, enum: ['vertical', 'single', 'double'], default: 'vertical' },
    readerWidth: { type: String, enum: ['fit', 'narrow', 'wide', 'original'], default: 'fit' },
    readerTone: { type: String, enum: ['dark', 'black', 'light', 'sepia'], default: 'dark' },
    imageGap: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
    newChapterAlerts: { type: Boolean, default: true },
  },

  readingProgress: [readProgressSchema],

  lastReadAt: { type: Date },

  // Tokens
  twoFactorEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, select: false },
  mfaPendingSecret: { type: String, select: false },
  mfaPendingExpires: { type: Date, select: false },
  mfaBackupHashes: { type: [String], select: false },
  mfaLastStep: { type: Number, default: -1, select: false },
  refreshTokenHash: { type: String, select: false },
  sessionVersion: { type: Number, default: 0, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },

  lastLoginAt: { type: Date },
  loginCount: { type: Number, default: 0 },

}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ isActive: 1 });
userSchema.index({ 'readingProgress.seriesId': 1 });

// ── Password Hashing ──────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    if (!this.isNew) this.sessionVersion = (this.sessionVersion || 0) + 1;
  }
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () { return require('../services/accountSecurity').publicJSON(this); };

userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', userSchema);
