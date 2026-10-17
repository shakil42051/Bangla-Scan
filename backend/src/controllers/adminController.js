'use strict';
const Series = require('../models/Series');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const Upload = require('../models/Upload');
const Genre = require('../models/Genre');
const Comment = require('../models/Comment');
const DriveAccount = require('../models/DriveAccount');
const Admin = require('../models/Admin');
const DriveManager = require('../services/driveManager');
const { body } = require('express-validator');

// ── Dashboard stats ───────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalSeries, totalChapters, totalUsers, totalUploads,
      recentSeries, recentChapters, popularSeries,
    ] = await Promise.all([
      Series.countDocuments(),
      Chapter.countDocuments(),
      User.countDocuments(),
      Upload.countDocuments({ status: 'active' }),
      Series.find().sort({ createdAt: -1 }).limit(5).select('title type status visibility createdAt coverImage').lean(),
      Chapter.find().sort({ createdAt: -1 }).limit(5).select('seriesId chapterNumber title createdAt visibility').lean(),
      Series.find({ visibility: 'public' }).sort({ views: -1 }).limit(5).select('title views rating type').lean(),
    ]);

    res.json({
      success: true,
      data: {
        counts: { series: totalSeries, chapters: totalChapters, users: totalUsers, uploads: totalUploads },
        recentSeries, recentChapters, popularSeries,
      },
    });
  } catch (err) { next(err); }
};

// ── Manage admin accounts ─────────────────────────────────────────────────────
exports.listAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (err) { next(err); }
};

exports.createAdminValidation = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').custom(require('../utils/passwordPolicy')).withMessage('Use at least 12 characters and at most 72 UTF-8 bytes.'),
  body('role').optional().isIn(['super_admin', 'admin', 'editor', 'moderator']),
];

exports.createAdmin = async (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can create admin accounts.' });
    }
    const { name, email, password, role, permissions } = req.body;
    const admin = await Admin.create({ name, email, passwordHash: password, role, permissions });
    res.status(201).json({ success: true, data: admin.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can update admin accounts.' });
    }
    const { name, role, permissions, isActive } = req.body;
    if (req.params.id === String(req.admin._id) && (isActive === false || (role && role !== 'super_admin'))) return res.status(400).json({ success: false, message: 'Your owner account must remain active with its owner role.' });
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { name, role, permissions, isActive },
      { new: true, runValidators: true },
    ).select('-passwordHash -refreshTokenHash');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
    res.json({ success: true, data: admin });
  } catch (err) { next(err); }
};

exports.deleteAdmin = async (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete admin accounts.' });
    }
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin deleted.' });
  } catch (err) { next(err); }
};

// ── Manage users ──────────────────────────────────────────────────────────────
exports.listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, q, isActive } = req.query;
    const filter = {};
    const text = String(q || '').slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (q) filter.$or = [{ username: new RegExp(text, 'i') }, { email: new RegExp(text, 'i') }];
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const result = await User.paginate(filter, {
      page: parseInt(page), limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-passwordHash -refreshTokenHash -googleId',
    });

    res.json({
      success: true,
      data: result.docs,
      pagination: { page: result.page, limit: result.limit, total: result.totalDocs, pages: result.totalPages },
    });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { isActive, role, banned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive, role, banned }, { new: true, runValidators: true },
    ).select('-passwordHash -refreshTokenHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
};

// ── Bulk operations ───────────────────────────────────────────────────────────
exports.bulkUpdateSeries = async (req, res, next) => {
  try {
    const { ids, update = {} } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || ids.some(id => !require('mongoose').isValidObjectId(id))) {
      return res.status(400).json({ success: false, message: 'IDs array required.' });
    }
    const allowed = ['visibility', 'status', 'type'];
    const safeUpdate = {};
    allowed.forEach((k) => { if (update[k] !== undefined) safeUpdate[k] = update[k]; });

    const result = await Series.updateMany({ _id: { $in: ids } }, { $set: safeUpdate }, { runValidators: true });
    res.json({ success: true, message: `Updated ${result.modifiedCount} series.` });
  } catch (err) { next(err); }
};

exports.bulkDeleteSeries = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || ids.some(id => !require('mongoose').isValidObjectId(id))) {
      return res.status(400).json({ success: false, message: 'IDs array required.' });
    }
    await Series.deleteMany({ _id: { $in: ids } });
    await Chapter.deleteMany({ seriesId: { $in: ids } });
    res.json({ success: true, message: `Deleted ${ids.length} series.` });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════════════════
// ── Drive Management (Persistent / DB-driven) ─────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/drives
 * Return all Drive accounts with health info (no secrets).
 */
exports.listDrives = async (req, res, next) => {
  try {
    const drives = await DriveManager.getSummary();
    res.json({ success: true, data: drives });
  } catch (err) { next(err); }
};

/**
 * POST /admin/drives
 * Add a new Drive account. Validates credentials before saving.
 */
exports.addDrive = async (req, res, next) => {
  try {
    const { email, credentials, label, rootFolderId, totalGB } = req.body;

    if (!email || !credentials) {
      return res.status(400).json({ success: false, message: 'Email and credentials are required.' });
    }

    // ── Parse credentials ─────────────────────────────────────────────────────
    let parsed = credentials;
    if (typeof credentials === 'string') {
      try { parsed = JSON.parse(credentials); } catch {
        return res.status(400).json({ success: false, message: 'credentials must be valid JSON.' });
      }
    }

    let authType = 'oauth2';
    let clientId, clientSecret, refreshToken, clientEmail, privateKey;

    if (parsed.type === 'service_account') {
      authType    = 'service_account';
      clientEmail = parsed.client_email;
      privateKey  = parsed.private_key;
      if (!clientEmail || !privateKey) {
        return res.status(400).json({ success: false, message: 'Invalid service account JSON (missing client_email or private_key).' });
      }
    } else {
      clientId     = parsed.clientId     || parsed.client_id     || parsed.web?.client_id     || parsed.installed?.client_id;
      clientSecret = parsed.clientSecret || parsed.client_secret || parsed.web?.client_secret || parsed.installed?.client_secret;
      refreshToken = parsed.refreshToken || parsed.refresh_token;

      if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials. OAuth2 requires clientId, clientSecret, and refreshToken. OR provide a Service Account JSON.',
        });
      }
    }

    // ── Validate credentials BEFORE saving ────────────────────────────────────
    let validationInfo;
    try {
      validationInfo = await DriveManager.validateCredentials({
        authType, clientId, clientSecret, refreshToken, clientEmail, privateKey,
      });
    } catch (valErr) {
      return res.status(400).json({
        success: false,
        message: `Credential validation failed: ${valErr.message}. Please check your credentials and try again.`,
      });
    }

    // ── Save to MongoDB ───────────────────────────────────────────────────────
    const name = label || (email.split('@')[0] + '-' + Date.now().toString().slice(-4));

    const totalBytes = totalGB
      ? parseFloat(totalGB) * 1073741824
      : 15 * 1024 * 1024 * 1024;

    const drive = await DriveAccount.create({
      name,
      email,
      authType,
      clientId,
      clientSecret,
      refreshToken,
      clientEmail,
      privateKey,
      rootFolderId: rootFolderId || '',
      totalBytes,
      isActive: true,
      health: {
        status:       'healthy',
        lastCheckedAt: new Date(),
        consecutiveFails: 0,
      },
      meta: {
        driveEmail:  validationInfo.email,
        storageQuota: validationInfo.storageQuota,
        lastSyncedAt: new Date(),
      },
    });

    // Warm the DriveManager cache immediately
    await DriveManager.reconnect(drive._id);

    res.status(201).json({
      success: true,
      message: `Drive account "${name}" connected and validated successfully.`,
      data: {
        _id:         drive._id,
        name:        drive.name,
        email:       drive.email,
        authType:    drive.authType,
        isActive:    drive.isActive,
        totalBytes:  drive.totalBytes,
        health:      drive.health,
        meta:        { driveEmail: validationInfo.email },
        createdAt:   drive.createdAt,
      },
    });
  } catch (err) { next(err); }
};

/**
 * PATCH /admin/drives/:id
 * Update Drive account settings (folder IDs, priority, label, totalGB).
 * Does NOT update credentials (use reconnect for that).
 */
exports.updateDrive = async (req, res, next) => {
  try {
    const { rootFolderId, chapterFolderId, coverFolderId, priority, isActive, totalGB, label } = req.body;

    if (totalGB !== undefined && (!Number.isFinite(Number(totalGB)) || Number(totalGB) <= 0)) return res.status(400).json({ success: false, message: 'Storage capacity must be greater than zero.' });
    if (priority !== undefined && (!Number.isInteger(Number(priority)) || Number(priority) < 0)) return res.status(400).json({ success: false, message: 'Storage priority must be a nonnegative integer.' });
    const update = {};
    if (rootFolderId    !== undefined) update.rootFolderId    = rootFolderId;
    if (chapterFolderId !== undefined) update.chapterFolderId = chapterFolderId;
    if (coverFolderId   !== undefined) update.coverFolderId   = coverFolderId;
    if (priority        !== undefined) update.priority        = parseInt(priority, 10);
    if (isActive        !== undefined) update.isActive        = isActive;
    if (totalGB         !== undefined) update.totalBytes      = parseFloat(totalGB) * 1073741824;
    if (label           !== undefined) update.name            = label;

    const drive = await DriveAccount.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-clientSecret -refreshToken -privateKey');
    if (!drive) return res.status(404).json({ success: false, message: 'Drive account not found.' });

    // Evict cache so settings are re-read next use
    DriveManager.evictClient(req.params.id);

    res.json({ success: true, message: 'Drive account updated.', data: drive });
  } catch (err) { next(err); }
};

/**
 * DELETE /admin/drives/:id
 * Remove a Drive account from the DB (does NOT delete files from Drive).
 */
exports.deleteDrive = async (req, res, next) => {
  try {
    if (await Upload.exists({ driveAccountId: req.params.id, status: 'active' })) return res.status(409).json({ success: false, message: 'This Drive still stores comic images. Keep its connection until those files have been moved or removed.' });
    const drive = await DriveAccount.findByIdAndDelete(req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive account not found.' });

    DriveManager.evictClient(req.params.id);

    res.json({ success: true, message: `Drive account "${drive.name}" disconnected and removed.` });
  } catch (err) { next(err); }
};

/**
 * POST /admin/drives/:id/reconnect
 * Force-reconnect a single Drive account (evict cache, re-validate).
 */
exports.reconnectDrive = async (req, res, next) => {
  try {
    const result = await DriveManager.reconnect(req.params.id);
    res.json({ success: true, message: 'Drive reconnected and validated.', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: `Reconnect failed: ${err.message}` });
  }
};

/**
 * POST /admin/drives/health-check
 * Run health check on ALL active drives. Updates health field in DB.
 */
exports.healthCheckDrives = async (req, res, next) => {
  try {
    const results = await DriveManager.healthCheckAll();
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

/**
 * GET /admin/drives/:id/files
 * List files in the root folder of a Drive account.
 */
exports.listDriveFiles = async (req, res, next) => {
  try {
    const drive = await DriveAccount.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive account not found.' });

    const folderId = req.query.folderId || drive.rootFolderId;
    if (!folderId) return res.status(400).json({ success: false, message: 'No folderId specified or configured.' });

    const files = await DriveManager.listFiles(req.params.id, folderId);
    res.json({ success: true, data: files });
  } catch (err) { next(err); }
};

/**
 * POST /admin/change-password
 * Change password for the logged-in administrator.
 */
exports.changeAdminPassword = require('../services/accountSecurity').changePassword;
