'use strict';
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  actorName: String, method: String, path: String, status: Number,
  createdAt: { type: Date, default: Date.now, expires: 90 * 86400 },
});
schema.index({ createdAt: -1 });
module.exports = mongoose.model('AuditEvent', schema);
