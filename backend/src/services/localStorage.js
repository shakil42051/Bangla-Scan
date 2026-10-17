'use strict';
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { fail } = require('../utils/http');
const LOCAL_ID = '000000000000000000000001';
const directory = () => path.resolve(process.env.MEDIA_DIRECTORY || path.join(__dirname, '../../data/media'));
function filePath(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw fail(400, 'Invalid media identifier.');
  const root = directory(); const resolved = path.resolve(root, id);
  if (!resolved.startsWith(root + path.sep)) throw fail(400, 'Invalid media location.');
  return resolved;
}
async function upload(buffer) {
  const fileId = crypto.randomUUID(); await fs.mkdir(directory(), { recursive: true });
  await fs.writeFile(filePath(fileId), buffer, { flag: 'wx', mode: 0o600 });
  return { fileId, driveId: LOCAL_ID, driveAccountName: 'Server storage', url: '/api/media/' + fileId, size: buffer.length };
}
async function remove(id) { await fs.unlink(filePath(id)).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
async function read(id) { return fs.readFile(filePath(id)); }
module.exports = { LOCAL_ID, directory, filePath, upload, remove, read };
