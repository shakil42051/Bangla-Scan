'use strict';
const router = require('express').Router();
const { pagination } = require('../utils/http');
router.use((req, res, next) => { const bounded = pagination(req.query); req.query.page = String(bounded.page); req.query.limit = String(bounded.limit); next(); });
const Comment = require('../models/Comment');
const { protect, adminProtect, optionalAuth, requirePermission } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Chapter = require('../models/Chapter');
const Settings = require('../models/Settings');
const { readableSeries, catalogFilter } = require('../middleware/contentAccess');
router.get('/recent', optionalAuth, async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query); const visible = await catalogFilter(req); const filter = Object.fromEntries(Object.entries(visible).map(([k, v]) => ['series.' + k, v]));
    const result = await Comment.aggregate([{ $match: { isHidden: false, parentId: null } }, { $lookup: { from: 'series', localField: 'seriesId', foreignField: '_id', as: 'series' } }, { $unwind: '$series' }, { $match: filter }, { $sort: { createdAt: -1 } }, { $facet: { data: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { content: 1, spoiler: 1, likeCount: 1, createdAt: 1, 'series._id': 1, 'series.title': 1 } }], total: [{ $count: 'count' }] } }]);
    const total = result[0]?.total[0]?.count || 0; res.json({ success: true, data: result[0]?.data || [], pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Get comments for series
router.get('/series/:seriesId', optionalAuth, async (req, res, next) => {
  try {
    await readableSeries(req, req.params.seriesId, false);
    const { page = 1, limit = 20, parentId = null } = req.query;
    const filter = { seriesId: req.params.seriesId, parentId: parentId || null, isHidden: false };
    const result = await Comment.paginate(filter, {
      page: parseInt(page), limit: parseInt(limit),
      sort: { isPinned: -1, createdAt: -1 },
      populate: [{ path: 'userId', select: 'username avatar' }],
      lean: true,
    });
    res.json({ success: true, data: result.docs, pagination: { page: result.page, total: result.totalDocs, pages: result.totalPages } });
  } catch (err) { next(err); }
});

// Get comments for chapter
router.get('/chapter/:chapterId', optionalAuth, async (req, res, next) => {
  try {
    const chapter = await Chapter.findOne({ _id: req.params.chapterId, visibility: 'public' });
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });
    await readableSeries(req, chapter.seriesId);
    const { page = 1, limit = 20 } = req.query;
    const result = await Comment.paginate(
      { chapterId: req.params.chapterId, parentId: null, isHidden: false },
      { page: parseInt(page), limit: parseInt(limit), sort: { isPinned: -1, likeCount: -1, createdAt: -1 }, populate: [{ path: 'userId', select: 'username avatar' }], lean: true }
    );
    res.json({ success: true, data: result.docs, pagination: { page: result.page, total: result.totalDocs, pages: result.totalPages } });
  } catch (err) { next(err); }
});

// Post comment
router.post('/', protect, [
  body('content').trim().notEmpty().isLength({ max: 2000 }),
  body('seriesId').isMongoId(),
  body('chapterId').optional().isMongoId(),
  body('parentId').optional().isMongoId(),
], validate, async (req, res, next) => {
  try {
    const { content, seriesId, chapterId, parentId, spoiler } = req.body;
    await readableSeries(req, seriesId, false);
    const config = await Settings.findById('global').lean();
    if (config?.commentsEnabled === false) return res.status(403).json({ success: false, message: 'Comments are disabled by the publisher.' });
    if (req.isAdmin) return res.status(403).json({ success: false, message: 'Use a reader account to join the discussion.' });
    if (chapterId && !await Chapter.exists({ _id: chapterId, seriesId, visibility: 'public' })) return res.status(400).json({ success: false, message: 'Invalid chapter.' });
    if (parentId && !await Comment.exists({ _id: parentId, seriesId, isHidden: false })) return res.status(400).json({ success: false, message: 'Invalid reply.' });
    const comment = await Comment.create({
      userId: req.user._id, content, seriesId, chapterId, parentId: parentId || null, spoiler,
    });
    await comment.populate('userId', 'username avatar');
    res.status(201).json({ success: true, data: comment });
  } catch (err) { next(err); }
});

// Like/unlike comment
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    if (req.isAdmin) return res.status(403).json({ success: false, message: 'Use a reader account to like discussions.' });
    const comment = await Comment.findOne({ _id: req.params.id, isHidden: false });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    await readableSeries(req, comment.seriesId, false);
    const userId = req.user._id;
    const updated = await Comment.findOneAndUpdate({ _id: comment._id, isHidden: false }, [
      { $set: { likes: { $cond: [{ $in: [userId, { $ifNull: ['$likes', []] }] }, { $setDifference: ['$likes', [userId]] }, { $setUnion: [{ $ifNull: ['$likes', []] }, [userId]] }] } } },
      { $set: { likeCount: { $size: '$likes' } } },
    ], { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Comment not found.' });
    res.json({ success: true, liked: updated.likes.some(id => String(id) === String(userId)), likeCount: updated.likeCount });
  } catch (err) { next(err); }
});

// Edit comment
router.put('/:id', protect, [body('content').trim().isLength({ min: 1, max: 2000 })], validate, async (req, res, next) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found or unauthorized.' });
    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();
    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
});

// Delete comment (owner or admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (req.isAdmin && req.admin.role !== 'super_admin' && !req.admin.permissions?.manageUsers) return res.status(403).json({ success: false, message: 'Comment moderation permission is required.' });
    const filter = req.isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };
    const result = await Comment.findOneAndDelete(filter);
    if (!result) return res.status(404).json({ success: false, message: 'Comment not found.' });
    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) { next(err); }
});

// Admin: hide/pin comment
router.patch('/:id/moderate', adminProtect, requirePermission('manageUsers'), async (req, res, next) => {
  try {
    const update = {};
    for (const key of ['isHidden', 'isPinned']) if (typeof req.body[key] === 'boolean') update[key] = req.body[key];
    const comment = await Comment.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
});

module.exports = router;
