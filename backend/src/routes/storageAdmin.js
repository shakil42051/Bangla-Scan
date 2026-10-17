'use strict';
const router = require('express').Router();
const Settings = require('../models/Settings');
const Upload = require('../models/Upload');
const local = require('../services/localStorage');
const s3 = require('../services/s3Storage');
const { fail } = require('../utils/http');
router.use(require('../middleware/auth').requirePermission('manageSettings'));
async function providers() {
  const drives = await require('../models/DriveAccount').countDocuments({ isActive: true });
  return [{ id: 'local', label: 'Server disk / mounted volume', ready: true }, { id: 'drive', label: 'Google Drive', ready: drives > 0 }, { id: 's3', label: process.env.S3_PROVIDER_LABEL || 'S3 / Cloudflare R2 / Backblaze B2 / MinIO', ready: s3.configured() }];
}
router.get('/', async (req, res, next) => {
  try {
    const usage = await Upload.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$driveAccountId', bytes: { $sum: '$size' }, files: { $sum: 1 } } }]);
    const totals = { local: { bytes: 0, files: 0 }, s3: { bytes: 0, files: 0 }, drive: { bytes: 0, files: 0 } };
    for (const item of usage) { const name = String(item._id) === local.LOCAL_ID ? 'local' : String(item._id) === s3.ID ? 's3' : 'drive'; totals[name].bytes += item.bytes; totals[name].files += item.files; }
    res.json({ success: true, data: { driver: await require('../services/storageProvider').selected(), providers: await providers(), usage: totals, directory: local.directory(), bytes: totals.local.bytes, files: totals.local.files, bucket: process.env.S3_BUCKET || '', maxImageMB: Math.min(10, Math.max(1, Number(process.env.MAX_FILE_SIZE_MB) || 5)), maxArchiveMB: 80 } });
  } catch (error) { next(error); }
});
router.put('/driver', async (req, res, next) => {
  try {
    const provider = (await providers()).find(p => p.id === req.body.driver);
    if (!provider || !provider.ready) throw fail(400, 'Configure this provider before selecting it.');
    await Settings.findByIdAndUpdate('global', { $set: { storageDriver: provider.id, updatedBy: req.admin._id } }, { upsert: true, runValidators: true });
    res.json({ success: true, message: 'New uploads will use ' + provider.label + '. Existing images retain their storage provider.' });
  } catch (error) { next(error); }
});
router.post('/check', async (req, res, next) => {
  try {
    if (req.body.driver === 's3') await s3.check();
    else if (req.body.driver === 'drive') {
      const results = await require('../services/driveManager').healthCheckAll();
      if (!results.length || results.some(r => r.status !== 'healthy')) throw fail(503, 'One or more Drive accounts need attention. Check their status below.');
    } else if (req.body.driver === 'local') {
      const fs = require('fs/promises'); await fs.mkdir(local.directory(), { recursive: true }); await fs.access(local.directory(), require('fs').constants.W_OK | require('fs').constants.R_OK);
    } else throw fail(400, 'Choose a supported storage provider.');
    res.json({ success: true, message: 'Storage connection check passed. S3 checks bucket access; an upload also requires object read/write permissions.' });
  } catch (error) { next(error.statusCode ? error : fail(503, 'Storage check failed. Check the server credentials, bucket permissions and endpoint.')); }
});
router.post('/secure-drive', async (req, res, next) => {
  try {
    const files = await Upload.find({ status: 'active', driveAccountId: { $nin: [local.LOCAL_ID, s3.ID] }, url: { $not: /^\/api\/media\// } }).limit(1000);
    let secured = 0; let failed = 0;
    for (const file of files) {
      try {
        const drive = await require('../services/driveManager').getClient(String(file.driveAccountId));
        let pageToken; const publicPermissions = [];
        do {
          const permissions = await drive.permissions.list({ fileId: file.fileId, pageSize: 100, pageToken, fields: 'nextPageToken,permissions(id,type)', supportsAllDrives: true });
          publicPermissions.push(...(permissions.data.permissions || []).filter(permission => ['anyone', 'domain'].includes(permission.type)));
          pageToken = permissions.data.nextPageToken;
        } while (pageToken);
        for (const permission of publicPermissions) await drive.permissions.delete({ fileId: file.fileId, permissionId: permission.id, supportsAllDrives: true });
        const url = '/api/media/' + file.fileId;
        for (const [model, field] of [['Series', 'coverImage'], ['Series', 'bannerImage'], ['HomepageSection', 'bannerImage'], ['UpcomingSeries', 'coverImage']]) await require('../models/' + model).updateMany({ [field + '.fileId']: file.fileId }, { $set: { [field + '.url']: url } });
        await require('../models/Chapter').updateMany({ 'pages.fileId': file.fileId }, { $set: { 'pages.$[page].url': url } }, { arrayFilters: [{ 'page.fileId': file.fileId }] });
        for (const field of ['logoUrl', 'faviconUrl']) await Settings.updateMany({ [field]: file.url }, { $set: { [field]: url } });
        file.url = url; await file.save(); secured++;
      } catch { failed++; }
    }
    res.json({ success: true, data: { secured, failed }, message: `${secured} Drive images secured; ${failed} need attention. Up to 1000 images are handled per run.` });
  } catch (error) { next(error); }
});
module.exports = router;
