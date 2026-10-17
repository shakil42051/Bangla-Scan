'use strict';
const router = require('express').Router();
const { pagination } = require('../utils/http');
router.use((req, res, next) => { const bounded = pagination(req.query); req.query.page = String(bounded.page); req.query.limit = String(bounded.limit); next(); });
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.use(protect);

// Get user notifications
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, data: notifications, unreadCount, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// Mark as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Mark all as read
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
});

// Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
