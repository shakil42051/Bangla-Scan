'use strict';
const mongoose = require('mongoose');
module.exports = mongoose.model('AuthThrottle', new mongoose.Schema({ _id: String, count: { type: Number, default: 0 }, expiresAt: { type: Date, expires: 0 } }));
