'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/chapterController');
const { adminProtect, optionalAuth, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/latest', optionalAuth, require('../controllers/discoveryController').latest);
router.get('/:id/download', optionalAuth, require('../controllers/downloadController').download);

// Public: list chapters for a series
router.get('/series/:seriesId', optionalAuth, ctrl.listChapters);

// Public: get chapter by series+number
router.get('/series/:seriesId/:chapterNumber', optionalAuth, ctrl.getChapter);

// Admin CRUD
router.get('/:id', adminProtect, requirePermission('manageChapters'), ctrl.getChapterById);
router.post('/', adminProtect, requirePermission('manageChapters'), ctrl.createChapterValidation, validate, ctrl.createChapter);
router.put('/:id', adminProtect, requirePermission('manageChapters'), ctrl.updateChapter);
router.patch('/:id', adminProtect, requirePermission('manageChapters'), ctrl.updateChapter);
router.delete('/:id', adminProtect, requirePermission('deleteContent'), ctrl.deleteChapter);

module.exports = router;
