'use strict';
const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }, // bytes

  fileId: { type: String, required: true }, // Google Drive file ID
  driveAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriveAccount', required: true },
  driveAccountName: String,

  url: { type: String, required: true },  // public direct link
  thumbnailUrl: { type: String, default: '' },

  type: {
    type: String,
    enum: ['chapter_page', 'cover', 'banner', 'avatar', 'other'],
    required: true,
  },

  // Association
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  status: { type: String, enum: ['active', 'replaced', 'deleted'], default: 'active' },
  replacedBy: { type: String }, // new fileId
}, { timestamps: true });

uploadSchema.index({ fileId: 1 });
uploadSchema.index({ driveAccountId: 1, status: 1 });
uploadSchema.index({ seriesId: 1, type: 1 });
uploadSchema.index({ chapterId: 1 });
uploadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Upload', uploadSchema);
