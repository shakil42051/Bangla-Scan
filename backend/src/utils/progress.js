'use strict';
const mongoose = require('mongoose');
// Replace all legacy duplicates for this series in one MongoDB operation.
const progressPipeline = (entry, now = new Date()) => [{ $set: {
  readingProgress: { $concatArrays: [
    { $filter: { input: { $ifNull: ['$readingProgress', []] }, as: 'entry', cond: { $ne: ['$$entry.seriesId', new mongoose.Types.ObjectId(entry.seriesId)] } } },
    [{ ...entry, seriesId: new mongoose.Types.ObjectId(entry.seriesId), chapterId: new mongoose.Types.ObjectId(entry.chapterId), updatedAt: now }],
  ] },
  lastReadAt: now,
} }];
module.exports = { progressPipeline };
