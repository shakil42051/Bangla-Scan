'use strict';
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // threading

  content: { type: String, required: true, trim: true, maxlength: 2000 },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },

  isEdited: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false }, // soft delete/moderation

  spoiler: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
}, { timestamps: true });

commentSchema.index({ seriesId: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ chapterId: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });

commentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Comment', commentSchema);
