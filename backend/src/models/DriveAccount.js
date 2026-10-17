'use strict';
const mongoose = require('mongoose');

const driveAccountSchema = new mongoose.Schema({
  name:     { type: String, required: true, unique: true },
  authType: { type: String, enum: ['oauth2', 'service_account'], default: 'oauth2' },

  // OAuth2 fields (stored securely, never returned by default)
  clientId:     { type: String },
  clientSecret: { type: String, select: false },
  refreshToken: { type: String, select: false },

  // Service Account fields
  clientEmail: { type: String },
  privateKey:  { type: String, select: false },

  // Human-readable identifier
  email: { type: String },

  // Folder configuration
  rootFolderId:    { type: String, default: '' },
  chapterFolderId: { type: String, default: '' }, // subfolder for chapter pages
  coverFolderId:   { type: String, default: '' }, // subfolder for covers/banners

  // Upload settings
  uploadSettings: {
    makePublic:     { type: Boolean, default: false },
    maxFileSizeMB:  { type: Number, default: 20 },
    allowedTypes:   { type: [String], default: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
  },

  // Usage tracking
  usedBytes:  { type: Number, default: 0 },
  totalBytes: { type: Number, default: 15 * 1024 * 1024 * 1024 }, // 15 GB default
  fileCount:  { type: Number, default: 0 },

  // Status & Health
  isActive:   { type: Boolean, default: true },
  priority:   { type: Number, default: 0 },   // lower = used first
  lastUsedAt: { type: Date },

  // Health monitoring
  health: {
    status:       { type: String, enum: ['healthy', 'degraded', 'disconnected', 'unknown'], default: 'unknown' },
    lastCheckedAt: { type: Date },
    lastErrorAt:  { type: Date },
    lastError:    { type: String, default: '' },
    consecutiveFails: { type: Number, default: 0 },
    autoReconnectAt:  { type: Date },
  },

  // Connection metadata (cached Drive metadata)
  meta: {
    driveEmail:     { type: String },  // confirmed email from Drive API
    storageQuota:   { type: Object },  // raw quota object from Drive
    lastSyncedAt:   { type: Date },
  },

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────
driveAccountSchema.index({ isActive: 1, priority: 1 });
driveAccountSchema.index({ 'health.status': 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
driveAccountSchema.virtual('usedPercent').get(function () {
  return ((this.usedBytes / this.totalBytes) * 100).toFixed(1);
});

driveAccountSchema.virtual('isFull').get(function () {
  return this.usedBytes >= this.totalBytes * 0.95; // 95% threshold
});

driveAccountSchema.virtual('freeBytes').get(function () {
  return Math.max(0, this.totalBytes - this.usedBytes);
});

// ── Cryptographic Credential Encryption ───────────────────────────────────────
const { encrypt, decrypt } = require('../services/credentialCrypto');

driveAccountSchema.pre('save', function (next) {
  if (this.isModified('clientSecret') && this.clientSecret) {
    this.clientSecret = encrypt(this.clientSecret);
  }
  if (this.isModified('refreshToken') && this.refreshToken) {
    this.refreshToken = encrypt(this.refreshToken);
  }
  if (this.isModified('privateKey') && this.privateKey) {
    this.privateKey = encrypt(this.privateKey);
  }
  next();
});

driveAccountSchema.post('init', function (doc) {
  if (doc.clientSecret) doc.clientSecret = decrypt(doc.clientSecret);
  if (doc.refreshToken) doc.refreshToken = decrypt(doc.refreshToken);
  if (doc.privateKey) doc.privateKey = decrypt(doc.privateKey);
});

module.exports = mongoose.model('DriveAccount', driveAccountSchema);
