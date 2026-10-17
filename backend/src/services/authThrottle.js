'use strict';
const Model = require('../models/AuthThrottle');
const { createHash } = require('crypto');
const key = (scope, value) => createHash('sha256').update(scope + ':' + value.toLowerCase()).digest('hex');
async function spend(scope, value, maximum = 10, windowMS = 15 * 60000) {
  const id = key(scope, value); const now = new Date();
  const update = [{ $set: { count: { $cond: [{ $gt: ['$expiresAt', now] }, { $add: [{ $ifNull: ['$count', 0] }, 1] }, 1] }, expiresAt: { $cond: [{ $gt: ['$expiresAt', now] }, '$expiresAt', new Date(now.getTime() + windowMS)] } } }];
  let row;
  try { row = await Model.findOneAndUpdate({ _id: id }, update, { upsert: true, new: true }); }
  catch (error) { if (error.code !== 11000) throw error; row = await Model.findOneAndUpdate({ _id: id }, update, { new: true }); }
  if (!row) return spend(scope, value, maximum, windowMS);
  return row.count <= maximum;
}
const clear = (scope, value) => Model.deleteOne({ _id: key(scope, value) });
module.exports = { spend, clear };
