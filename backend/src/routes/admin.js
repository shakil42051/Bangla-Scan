'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { adminProtect, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { pagination } = require('../utils/http');
router.use((req, res, next) => { Object.assign(req.query, pagination(req.query)); next(); });

router.use(adminProtect);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboardStats);

// ── Admin management (super_admin only enforced in controller) ────────────────
router.get('/admins', requirePermission('manageAdmins'), ctrl.listAdmins);
router.post('/admins',       ctrl.createAdminValidation, validate, ctrl.createAdmin);
router.put('/admins/:id',    ctrl.updateAdmin);
router.delete('/admins/:id', ctrl.deleteAdmin);

// ── User management ───────────────────────────────────────────────────────────
router.get('/users', requirePermission('manageUsers'), ctrl.listUsers);
router.put('/users/:id', requirePermission('manageUsers'), ctrl.updateUser);
router.delete('/users/:id', requirePermission('manageUsers'), ctrl.deleteUser);

// ── Bulk operations ───────────────────────────────────────────────────────────
router.post('/series/bulk-update', requirePermission('manageSeries'), ctrl.bulkUpdateSeries);
router.post('/series/bulk-delete', requirePermission('deleteContent'), ctrl.bulkDeleteSeries);

// ── Drive management (persistent, DB-backed) ──────────────────────────────────
// List all drives (with health info)
router.get('/drives',                       requirePermission('manageSettings'), ctrl.listDrives);
// Add a new drive (validates credentials before saving)
router.post('/drives',                      requirePermission('manageSettings'), ctrl.addDrive);
// Update drive settings (folders, priority, label, totalGB)
router.patch('/drives/:id',                 requirePermission('manageSettings'), ctrl.updateDrive);
// Remove a drive
router.delete('/drives/:id',                requirePermission('manageSettings'), ctrl.deleteDrive);
// Force reconnect one drive
router.post('/drives/:id/reconnect',        requirePermission('manageSettings'), ctrl.reconnectDrive);
// Health-check ALL drives (used by cron + admin button)
router.post('/drives/health-check',         requirePermission('manageSettings'), ctrl.healthCheckDrives);
// List files in a drive folder
router.get('/drives/:id/files',             requirePermission('manageSettings'), ctrl.listDriveFiles);
// Change admin password
router.post('/change-password', ctrl.changeAdminPassword);

module.exports = router;
