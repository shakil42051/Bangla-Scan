'use strict';
const router = require('express').Router();
const { multerUpload } = require('../services/uploadService');
const ctrl = require('../controllers/uploadController');
const { adminProtect, requirePermission } = require('../middleware/auth');
const safeBody = require('../middleware/requestSafety');
const uploadSlots = require('../middleware/uploadSlots');

// All upload routes require admin
router.use(adminProtect);
const publishingAccess = (req, res, next) => ['manageSeries', 'manageChapters', 'manageSettings', 'manageHomepage'].some(permission => req.admin.hasPermission(permission)) ? next() : res.status(403).json({ success: false, message: 'Publishing permission is required.' });

// Bulk pages upload
router.post('/pages', requirePermission('manageChapters'), uploadSlots, multerUpload.array('pages', 20), safeBody, ctrl.uploadPages);

// Single file (cover, banner, etc.)
router.post('/single', publishingAccess, uploadSlots, multerUpload.single('file'), safeBody, ctrl.uploadSingle);

// Replace a file
router.post('/replace', publishingAccess, uploadSlots, multerUpload.single('file'), safeBody, ctrl.replaceFile);

// Delete a file
router.delete('/file', requirePermission('deleteContent'), ctrl.deleteFile);

// List uploads
router.get('/', publishingAccess, ctrl.listUploads);

// Drive accounts summary
router.get('/drive-accounts', publishingAccess, ctrl.getDriveAccounts);

module.exports = router;
