'use strict';
const { fail } = require('./http');
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_BATCH = 80 * 1024 * 1024;
const MAX_PAGES = 200;
function imageType(buffer) {
  if (buffer.length > MAX_IMAGE) throw fail(413, 'An image exceeds 10 MB.');
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString())) return 'image/gif';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  throw fail(400, 'The file is not a supported JPEG, PNG, GIF or WebP image.');
}
function validateBatch(files) {
  if (!files?.length) throw fail(400, 'Choose at least one image.');
  if (files.length > MAX_PAGES || files.reduce((sum, f) => sum + f.buffer.length, 0) > MAX_BATCH) throw fail(413, 'Batch exceeds 200 pages or 80 MB.');
  return files.map(file => ({ ...file, mimetype: imageType(file.buffer) }));
}
module.exports = { imageType, validateBatch, MAX_IMAGE, MAX_BATCH, MAX_PAGES };
