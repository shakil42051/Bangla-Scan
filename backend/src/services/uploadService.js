'use strict';
const multer = require('multer');
const path = require('path');
const { uploadToDrive, deleteFromDrive } = require('./driveService');
const Upload = require('../models/Upload');
const Series = require('../models/Series');
const Chapter = require('../models/Chapter');
const Homepage = require('../models/HomepageSection');
const Upcoming = require('../models/UpcomingSeries');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');
const { imageType, MAX_BATCH } = require('../utils/uploadValidation');

// Bounded in-memory staging before transfer to the configured storage provider.
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = Math.min(10, Math.max(1, parseInt(process.env.MAX_FILE_SIZE_MB) || 5)) * 1024 * 1024;

const multerUpload = multer({
  storage: {
    _handleFile(req, file, callback) {
      const archive = ['.zip', '.cbz'].includes(path.extname(file.originalname).toLowerCase());
      const max = archive ? MAX_BATCH : MAX_FILE_SIZE; let size = 0; let done = false; const chunks = [];
      const finish = (error, value) => { if (done) return; done = true; callback(error, value); };
      file.stream.on('data', chunk => {
        if (done) return; size += chunk.length; req.uploadBytes = (req.uploadBytes || 0) + chunk.length;
        if (size > max || req.uploadBytes > MAX_BATCH) { chunks.length = 0; finish(new multer.MulterError('LIMIT_FILE_SIZE')); return; }
        chunks.push(chunk);
      });
      file.stream.on('error', finish);
      file.stream.on('end', () => finish(null, { buffer: Buffer.concat(chunks), size }));
    },
    _removeFile(req, file, callback) { delete file.buffer; callback(null); },
  },
  limits: { fileSize: MAX_BATCH, files: 20, fields: 20, fieldSize: 65536, parts: 45 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.includes(file.mimetype) || ext === '.zip' || ext === '.cbz') {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Choose JPEG, PNG, GIF, WebP, ZIP or CBZ files.'), { statusCode: 400 }));
    }
  },
});

/**
 * Upload a single image buffer to the configured provider and record it in DB.
 */
const uploadFile = async ({
  buffer, originalName, mimeType, size, type,
  seriesId, chapterId, uploadedBy, folderId,
}) => {
  mimeType = imageType(buffer);
  const policy = await Settings.findById('global').select('maxFileSizeMB allowedImageTypes').lean();
  const limitMB = Math.min(MAX_FILE_SIZE / 1024 / 1024, Number(policy?.maxFileSizeMB) || 10);
  if (buffer.length > limitMB * 1024 * 1024) throw Object.assign(new Error('Image exceeds the configured ' + limitMB + ' MB upload limit.'), { statusCode: 413 });
  if (policy?.allowedImageTypes?.length && !policy.allowedImageTypes.includes(mimeType)) throw Object.assign(new Error('This image type is disabled in upload settings.'), { statusCode: 400 });
  const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[mimeType];
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const driveResult = await uploadToDrive(buffer, safeName, mimeType, folderId);

  let upload;
  try { upload = await Upload.create({
    originalName,
    mimeType,
    size: driveResult.size || size || buffer.length,
    fileId: driveResult.fileId,
    driveAccountId: driveResult.driveId,
    driveAccountName: driveResult.driveAccountName,
    url: driveResult.url,
    type,
    seriesId,
    chapterId,
    uploadedBy,
    status: 'active',
  }); } catch (error) {
    await deleteFromDrive(driveResult.fileId, driveResult.driveId).catch(cleanup => logger.warn('Upload cleanup failed: ' + cleanup.message));
    throw error;
  }

  return upload;
};

/**
 * Bulk upload chapter pages.
 * files: array of multer file objects (sorted by originalname for order).
 * Returns ordered page array for chapter.
 */
const uploadChapterPages = async ({ files, seriesId, chapterId, uploadedBy }) => {
  // Sort by filename to maintain order
  const sorted = [...files].sort((a, b) =>
    a.originalname.localeCompare(b.originalname, undefined, { numeric: true })
  );

  const pages = [];
  try {
  for (let i = 0; i < sorted.length; i++) {
    const file = sorted[i];
    const upload = await uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type: 'chapter_page',
      seriesId,
      chapterId,
      uploadedBy,
    });

    pages.push({
      order: i + 1,
      fileId: upload.fileId,
      driveId: upload.driveAccountId.toString(),
      url: upload.url,
      size: upload.size,
    });
  }

  } catch (error) {
    await Promise.allSettled(pages.map(page => deleteFile(page.fileId, page.driveId)));
    throw error;
  }
  return pages;
};

/**
 * Upload replacement, switch references, then retire the old file.
 */
const replaceFile = async ({ oldFileId, oldDriveAccountId, newBuffer, originalName, mimeType, type, seriesId, chapterId, uploadedBy }) => {
  const old = await Upload.findOne({ fileId: oldFileId, driveAccountId: oldDriveAccountId, status: 'active' });
  if (!old) throw Object.assign(new Error('Original upload not found.'), { statusCode: 404 });
  const replacement = await uploadFile({ buffer: newBuffer, originalName, mimeType, size: newBuffer.length, type: old.type, seriesId: old.seriesId, chapterId: old.chapterId, uploadedBy });
  const ref = { fileId: replacement.fileId, driveId: String(replacement.driveAccountId), url: replacement.url };
  // Keep the old file intact unless all references have switched successfully.
  await Series.updateMany({ 'coverImage.fileId': oldFileId }, { $set: { coverImage: ref } });
  await Series.updateMany({ 'bannerImage.fileId': oldFileId }, { $set: { bannerImage: ref } });
  await Chapter.updateMany({ 'pages.fileId': oldFileId }, { $set: { 'pages.$[page].fileId': ref.fileId, 'pages.$[page].driveId': ref.driveId, 'pages.$[page].url': ref.url } }, { arrayFilters: [{ 'page.fileId': oldFileId }] });
  await Homepage.updateMany({ 'bannerImage.fileId': oldFileId }, { $set: { bannerImage: ref } });
  await Upcoming.updateMany({ 'coverImage.fileId': oldFileId }, { $set: { coverImage: ref } });
  await Settings.updateMany({ logoUrl: old.url }, { $set: { logoUrl: replacement.url } });
  await Settings.updateMany({ faviconUrl: old.url }, { $set: { faviconUrl: replacement.url } });
  await Upload.findByIdAndUpdate(old._id, { status: 'replaced', replacedBy: replacement.fileId });
  try { await deleteFromDrive(oldFileId, oldDriveAccountId); }
  catch (err) { logger.warn('Replacement saved; old file cleanup deferred: ' + err.message); }
  return replacement;
};

/**
 * Delete an unused file from its provider and mark its upload record as deleted.
 */
const deleteFile = async (fileId, driveAccountId) => {
  const record = await Upload.findOne({ fileId, driveAccountId, status: 'active' });
  if (!record) throw Object.assign(new Error('Upload not found.'), { statusCode: 404 });
  const linked = await Series.exists({ $or: [{ 'coverImage.fileId': fileId }, { 'bannerImage.fileId': fileId }] }) || await Chapter.exists({ 'pages.fileId': fileId }) || await Homepage.exists({ 'bannerImage.fileId': fileId }) || await Upcoming.exists({ 'coverImage.fileId': fileId }) || await Settings.exists({ $or: [{ logoUrl: record.url }, { faviconUrl: record.url }] });
  if (linked) throw Object.assign(new Error('This file is still used by a series or chapter. Replace it or remove the reference first.'), { statusCode: 409 });
  await deleteFromDrive(fileId, driveAccountId);
  await Upload.findOneAndUpdate({ fileId }, { status: 'deleted' });
};

module.exports = {
  multerUpload,
  uploadFile,
  uploadChapterPages,
  replaceFile,
  deleteFile,
};
