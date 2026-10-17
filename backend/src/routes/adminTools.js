'use strict';
const router = require('express').Router();
const { adminProtect, requirePermission } = require('../middleware/auth');
const { pagination } = require('../utils/http');
const Comment = require('../models/Comment');
router.use(adminProtect);
router.get('/audit', requirePermission('manageSettings'), async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query); const Model = require('../models/AuditEvent');
    const [data, total] = await Promise.all([Model.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Model.countDocuments()]);
    res.json({ success: true, data, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});
router.get('/reports', requirePermission('manageChapters'), async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query); const Model = require('../models/IssueReport');
    const filter = ['open', 'in_progress', 'resolved', 'dismissed'].includes(req.query.status) ? { status: req.query.status } : {};
    const [data, total] = await Promise.all([Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('seriesId', 'title').populate('userId', 'username').lean(), Model.countDocuments(filter)]);
    res.json({ success: true, data, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});
router.patch('/reports/:id', requirePermission('manageChapters'), async (req, res, next) => {
  try {
    if (!['open', 'in_progress', 'resolved', 'dismissed'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Choose a valid report status.' });
    const report = await require('../models/IssueReport').findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
});
router.get('/comments', requirePermission('manageUsers'), async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query); const filter = req.query.hidden === 'true' ? { isHidden: true } : {};
    const [data, total] = await Promise.all([Comment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('seriesId', 'title').populate('userId', 'username').lean(), Comment.countDocuments(filter)]);
    res.json({ success: true, data, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});
router.get('/export', requirePermission('manageSettings'), async (req, res, next) => {
  try {
    const models = ['Series', 'Chapter', 'Genre', 'HomepageSection', 'UpcomingSeries']; const data = {};
    for (const name of models) data[name] = await require('../models/' + name).find().lean();
    data.settings = await require('../models/Settings').findById('global').select('-adScript -updatedBy').lean();
    res.attachment('bangla-scan-catalog-backup.json').json({ version: 1, exportedAt: new Date().toISOString(), data });
  } catch (error) { next(error); }
});
router.use('/storage', require('./storageAdmin'));
router.get('/system', requirePermission('manageSettings'), async (req, res) => {
  res.json({ success: true, data: { database: require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected', uptime: Math.floor(process.uptime()), emailConfigured: require('../services/mailer').configured(), uploadLimitMB: Math.min(10, Math.max(1, Number(process.env.MAX_FILE_SIZE_MB) || 5)) } });
});
module.exports = router;
