'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/seriesController');
const { adminProtect, optionalAuth, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Public routes (optional auth for user-specific data)
router.get('/', optionalAuth, ctrl.listSeries);
router.get('/random', optionalAuth, require('../controllers/discoveryController').random);
router.get('/search', optionalAuth, ctrl.search);
router.get('/:idOrSlug', optionalAuth, ctrl.getSeries);

// Admin routes
router.post('/', adminProtect, requirePermission('manageSeries'), ctrl.createSeriesValidation, validate, ctrl.createSeries);
router.put('/:id', adminProtect, requirePermission('manageSeries'), ctrl.updateSeries);
router.patch('/:id', adminProtect, requirePermission('manageSeries'), ctrl.updateSeries);
router.delete('/:id', adminProtect, requirePermission('deleteContent'), ctrl.deleteSeries);

module.exports = router;
