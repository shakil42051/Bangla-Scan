'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const security = require('../services/accountSecurity');
const { fail } = require('../utils/http');
router.use(require('../middleware/auth').protect);
router.get('/', async (req, res, next) => {
  try {
    const role = security.actorOf(req); const entity = await security.model(role).findById(req.user._id).select('+mfaBackupHashes');
    if (!entity?.isActive) throw fail(401, 'Sign in again to manage account security.');
    const events = await require('../models/AuthEvent').find({ ownerId: req.user._id, actor: role }).sort({ createdAt: -1 }).limit(12).select('action network device createdAt').lean();
    res.json({ success: true, data: { twoFactorEnabled: Boolean(entity.twoFactorEnabled), backupCodesRemaining: entity.mfaBackupHashes?.length || 0, events, emailConfigured: require('../services/mailer').configured() } });
  } catch (error) { next(error); }
});
router.use(require('express-rate-limit')({ windowMs: 15 * 60000, max: 10 }));
const validations = [body('password').isString().isLength({ min: 1, max: 128 }), body('code').optional().isString().isLength({ max: 32 })];
router.post('/setup', validations, validate, async (req, res, next) => {
  try {
    const entity = await security.reauthenticate(req);
    if (entity.twoFactorEnabled) throw fail(400, 'Two-step verification is already enabled.');
    const secret = new (require('otpauth').Secret)({ size: 20 }).base32;
    const stored = await security.model(security.actorOf(req)).updateOne({ _id: entity._id, ...security.versionFilter(entity), twoFactorEnabled: { $ne: true } }, { $set: { mfaPendingSecret: security.encrypt(secret), mfaPendingExpires: new Date(Date.now() + 10 * 60000) } });
    if (!stored.modifiedCount) throw fail(409, 'Account security changed. Sign in again.');
    const otp = security.totp(secret); otp.label = entity.email;
    res.json({ success: true, data: { secret, uri: otp.toString() }, message: 'Enter this key in an authenticator app, then confirm with its six-digit code.' });
  } catch (error) { next(error); }
});
router.post('/:action', validations, validate, async (req, res, next) => {
  try {
    const action = req.params.action;
    if (!['enable', 'disable', 'regenerate'].includes(action)) throw fail(404, 'Security action not found.');
    const entity = await security.reauthenticate(req); const role = security.actorOf(req); const Model = security.model(role); let generated;
    const filter = { _id: entity._id, ...security.versionFilter(entity) };
    let update;
    if (action === 'enable') {
      if (entity.twoFactorEnabled || !entity.mfaPendingSecret || !entity.mfaPendingExpires || entity.mfaPendingExpires <= new Date()) throw fail(400, 'Start a new authenticator setup.');
      const otp = security.totp(security.decrypt(entity.mfaPendingSecret));
      const delta = typeof req.body.code === 'string' && /^\d{6}$/.test(req.body.code) ? otp.validate({ token: req.body.code, window: 1 }) : null;
      if (delta === null) throw fail(400, 'The authenticator code is incorrect.');
      generated = security.codes(); filter.mfaPendingSecret = entity.mfaPendingSecret;
      update = { twoFactorEnabled: true, mfaSecret: entity.mfaPendingSecret, mfaLastStep: Math.floor(Date.now() / 30000) + delta, mfaBackupHashes: generated.hashes };
    } else {
      if (!entity.twoFactorEnabled || !await security.factor(entity, role, req.body.code)) throw fail(403, 'A valid authenticator or unused recovery code is required.');
      filter.twoFactorEnabled = true;
      if (action === 'regenerate') { generated = security.codes(); update = { mfaBackupHashes: generated.hashes }; }
      else update = { twoFactorEnabled: false, mfaSecret: null, mfaBackupHashes: [], mfaLastStep: -1 };
    }
    const result = await Model.updateOne(filter, { $set: { ...update, refreshTokenHash: null }, $unset: { mfaPendingSecret: '', mfaPendingExpires: '' }, $inc: { sessionVersion: 1 } });
    if (!result.modifiedCount) throw fail(409, 'Account security changed. Sign in again and retry.');
    security.clearRefresh(res); require('../services/mediaSession').clear(res);
    await security.event(entity, role, 'two_factor_' + action, req);
    const mail = require('../services/mailer'); if (mail.configured()) mail.queue(() => mail.sendSecurityNotice(entity.email, 'Your two-step verification settings changed. All sessions were signed out.'));
    res.json({ success: true, data: { ...(generated ? { recoveryCodes: generated.values } : {}) }, message: 'Security settings updated. Save any recovery codes, then sign in again.' });
  } catch (error) { next(error); }
});
module.exports = router;
