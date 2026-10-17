'use strict';
const Chapter = require('../models/Chapter');
const Series = require('../models/Series');
const Bookmark = require('../models/Bookmark');
const { catalogFilter } = require('../middleware/contentAccess');
const { pagination } = require('../utils/http');
exports.latest = async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query, 50); const visible = await catalogFilter(req);
    const seriesFilter = Object.fromEntries(Object.entries(visible).map(([key, value]) => ['series.' + key, value]));
    seriesFilter['series.type'] = req.query.type || { $ne: 'novel' };
    if (req.query.followed === 'true') {
      if (!req.user || req.isAdmin) return res.status(401).json({ success: false, message: 'Sign in with a reader account to view followed updates.' });
      seriesFilter['series._id'] = { $in: await Bookmark.distinct('seriesId', { userId: req.user._id, status: { $ne: 'dropped' } }) };
    }
    const result = await Chapter.aggregate([
      { $match: { visibility: 'public' } }, { $project: { pages: 0 } },
      { $lookup: { from: 'series', localField: 'seriesId', foreignField: '_id', as: 'series' } }, { $unwind: '$series' }, { $match: seriesFilter },
      { $sort: { createdAt: -1, _id: -1 } }, { $facet: { data: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { 'series.seoData': 0 } }], total: [{ $count: 'count' }] } },
    ]);
    const total = result[0]?.total[0]?.count || 0;
    res.json({ success: true, data: result[0]?.data || [], pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};
exports.random = async (req, res, next) => {
  try { const filter = await catalogFilter(req); filter.type = { $ne: 'novel' }; const data = await Series.aggregate([{ $match: filter }, { $sample: { size: 1 } }, { $project: { _id: 1, slug: 1 } }]); res.json({ success: true, data: data[0] || null }); }
  catch (error) { next(error); }
};
