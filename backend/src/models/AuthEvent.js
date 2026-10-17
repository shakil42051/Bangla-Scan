'use strict';
const mongoose = require('mongoose');
const schema = new mongoose.Schema({ ownerId: { type: mongoose.Schema.Types.ObjectId, required: true }, actor: { type: String, enum: ['user', 'admin'] }, action: String, network: String, device: String, createdAt: { type: Date, default: Date.now, expires: 30 * 86400 } });
schema.index({ ownerId: 1, actor: 1, createdAt: -1 });
module.exports = mongoose.model('AuthEvent', schema);
