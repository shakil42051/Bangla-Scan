'use strict';
const local = require('./localStorage');
const s3 = require('./s3Storage');
async function selected() { return (await require('../models/Settings').findById('global').select('storageDriver').lean())?.storageDriver || process.env.STORAGE_DRIVER || 'local'; }
async function upload(buffer, name, mimeType, folder) {
  const driver = await selected();
  if (driver === 's3') return s3.upload(buffer, mimeType);
  if (driver === 'drive') return require('./driveManager').upload(buffer, name, mimeType, folder);
  if (driver !== 'local') throw new Error('Unknown storage provider.');
  return local.upload(buffer);
}
async function read(fileId, driveId) {
  if (String(driveId) === local.LOCAL_ID) return local.read(fileId);
  if (String(driveId) === s3.ID) return s3.read(fileId);
  const client = await require('./driveManager').getClient(String(driveId));
  const result = await client.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer', maxContentLength: 10 * 1024 * 1024, timeout: 15000 });
  return Buffer.from(result.data);
}
function remove(fileId, driveId) {
  if (String(driveId) === local.LOCAL_ID) return local.remove(fileId);
  if (String(driveId) === s3.ID) return s3.remove(fileId);
  return require('./driveManager').delete(fileId, driveId);
}
module.exports = { selected, upload, read, remove };
