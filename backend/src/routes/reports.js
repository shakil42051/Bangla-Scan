'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
router.post('/', protect, require('express-rate-limit')({ windowMs: 3600000, max: 10 }), [
  body('seriesId').isMongoId(), body('reason').isIn(['missing_pages', 'wrong_order', 'translation', 'broken_image', 'other']),
  body('details').optional().isString().isLength({ max: 2000 }), body('chapterNumber').optional().isFloat({ min: 0 }), body('page').optional().isInt({ min: 1, max: 200 }),
], require('../middleware/validate'), async (req, res, next) => {
  try {
    if (req.isAdmin) return res.status(403).json({ success: false, message: 'Use a reader account to report a chapter problem.' });
    await require('../middleware/contentAccess').readableSeries(req, req.body.seriesId, false);
    const { seriesId, reason, details, chapterNumber, page } = req.body;
    if (chapterNumber !== undefined) {
      const chapter = await require('../models/Chapter').findOne({ seriesId, chapterNumber, visibility: 'public' }).lean();
      if (!chapter || page > chapter.pages.length) return res.status(400).json({ success: false, message: 'Choose a published chapter and a valid page.' });
    }
    await require('../models/IssueReport').create({ userId: req.user._id, seriesId, reason, details, chapterNumber, page });
    res.status(201).json({ success: true, message: 'Report sent to the publishing team.' });
  } catch (error) { next(error); }
});
module.exports = router;
