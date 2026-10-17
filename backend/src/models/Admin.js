'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true, lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  passwordHash: { type: String, required: true, select: false },

  role: {
    type: String,
    enum: ['super_admin', 'admin', 'editor', 'moderator'],
    default: 'editor',
  },

  permissions: {
    manageSeries: { type: Boolean, default: true },
    manageChapters: { type: Boolean, default: true },
    manageUsers: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false },
    manageSettings: { type: Boolean, default: false },
    viewAnalytics: { type: Boolean, default: true },
    manageHomepage: { type: Boolean, default: false },
    deleteContent: { type: Boolean, default: false },
  },

  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  loginCount: { type: Number, default: 0 },

  twoFactorEnabled: { type: Boolean, default: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  mfaSecret: { type: String, select: false },
  mfaPendingSecret: { type: String, select: false },
  mfaPendingExpires: { type: Date, select: false },
  mfaBackupHashes: { type: [String], select: false },
  mfaLastStep: { type: Number, default: -1, select: false },
  refreshTokenHash: { type: String, select: false },
  sessionVersion: { type: Number, default: 0, select: false },
  avatar: { type: String, default: '' },
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  if (!this.isNew) this.sessionVersion = (this.sessionVersion || 0) + 1;
  next();
});

adminSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

adminSchema.methods.toPublicJSON = function () { return require('../services/accountSecurity').publicJSON(this); };

// Super admin always has all permissions
adminSchema.methods.hasPermission = function (perm) {
  if (this.role === 'super_admin') return true;
  return !!this.permissions[perm];
};

module.exports = mongoose.model('Admin', adminSchema);
