'use strict';
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['new_chapter', 'comment_reply', 'comment_like', 'system', 'announcement'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: '' }, // frontend route

  // References
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },

  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, chapterId: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'new_chapter', chapterId: { $exists: true } } });

module.exports = mongoose.model('Notification', notificationSchema);
