'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OTPAuth = require('otpauth');
const { encrypt: protect, decrypt: unprotect } = require('./credentialCrypto');
const encrypt = value => protect(value, process.env.AUTH_ENCRYPTION_KEY || process.env.JWT_SECRET);
const decrypt = value => unprotect(value, process.env.AUTH_ENCRYPTION_KEY || process.env.JWT_SECRET);
const { fail } = require('../utils/http');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fields = '+passwordHash +sessionVersion +mfaSecret +mfaPendingSecret +mfaPendingExpires +mfaBackupHashes +mfaLastStep';
const model = actor => require('../models/' + (actor === 'admin' ? 'Admin' : 'User'));
const actorOf = req => req.isAdmin ? 'admin' : 'user';
const versionFilter = entity => entity.sessionVersion ? { sessionVersion: entity.sessionVersion } : { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] };
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth' });
function setRefresh(res, token) { res.cookie('bs_refresh', token, { ...cookieOptions(), maxAge: 7 * 86400000 }); }
function clearRefresh(res) { res.clearCookie('bs_refresh', cookieOptions()); }
function refreshFrom(req) {
  const value = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('bs_refresh='));
  let cookie; try { cookie = value ? decodeURIComponent(value.slice(11)) : undefined; } catch { throw fail(400, 'Invalid session cookie.'); }
  if (cookie && req.body.refreshToken && cookie !== req.body.refreshToken) throw fail(400, 'Conflicting session credentials.');
  return cookie || req.body.refreshToken;
}
function totp(secret) { return new OTPAuth.TOTP({ issuer: 'Bangla Scan', algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) }); }
async function factor(entity, actor, code) {
  if (!entity.twoFactorEnabled) return true;
  if (typeof code !== 'string' || code.length > 32) return false;
  const Model = model(actor); const version = entity.sessionVersion || 0;
  if (/^[a-f0-9]{5}(?:-[a-f0-9]{5}){3}$/i.test(code)) {
    const digest = hash(code.toLowerCase());
    const used = await Model.updateOne({ _id: entity._id, twoFactorEnabled: true, mfaBackupHashes: digest, sessionVersion: version }, { $pull: { mfaBackupHashes: digest } });
    return used.modifiedCount === 1;
  }
  if (!/^\d{6}$/.test(code) || !entity.mfaSecret) return false;
  const otp = totp(decrypt(entity.mfaSecret)); const delta = otp.validate({ token: code, window: 1 });
  if (delta === null) return false;
  const step = Math.floor(Date.now() / 30000) + delta;
  const used = await Model.updateOne({ _id: entity._id, twoFactorEnabled: true, sessionVersion: version, mfaLastStep: { $lt: step } }, { $set: { mfaLastStep: step } });
  return used.modifiedCount === 1;
}
function codes() { const values = Array.from({ length: 8 }, () => crypto.randomBytes(10).toString('hex').match(/.{5}/g).join('-')); return { values, hashes: values.map(hash) }; }
async function reauthenticate(req) {
  if (!await require('./authThrottle').spend('reauth:' + actorOf(req), String(req.user._id))) throw fail(429, 'Too many security attempts. Wait 15 minutes before trying again.');
  const entity = await model(actorOf(req)).findById(req.user._id).select(fields);
  if (!entity?.isActive || typeof req.body.password !== 'string' || req.body.password.length > 128 || !await entity.comparePassword(req.body.password)) throw fail(403, 'Your current password is required.');
  return entity;
}
function publicJSON(entity) {
  const value = entity.toObject ? entity.toObject() : { ...entity };
  for (const key of ['passwordHash', 'refreshTokenHash', 'sessionVersion', 'googleId', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'emailVerificationExpires', 'mfaSecret', 'mfaPendingSecret', 'mfaPendingExpires', 'mfaBackupHashes', 'mfaLastStep']) delete value[key];
  return value;
}
async function event(entity, actor, action, req) {
  if (require('mongoose').connection.readyState !== 1) return;
  const ip = String(req.ip || '').replace(/^::ffff:/, '');
  const network = ip.includes('.') ? ip.split('.').slice(0, 3).join('.') + '.*' : ip.split(':').slice(0, 3).join(':') + '::';
  await require('../models/AuthEvent').create({ ownerId: entity._id, actor, action, network, device: String(req.headers['user-agent'] || 'Unknown browser').slice(0, 160) }).catch(() => require('../utils/logger').warn('Security activity could not be recorded.'));
}
const dummy = bcrypt.hashSync('placeholder-for-unknown-login', 12);
async function changePassword(req, res, next) {
  try {
    req.body.password = req.body.currentPassword;
    const entity = await reauthenticate(req); const actor = actorOf(req);
    if (!require('../utils/passwordPolicy')(req.body.newPassword)) throw fail(400, 'Use 12 or more characters and a password shorter than 72 UTF-8 bytes.');
    if (!await factor(entity, actor, req.body.code)) throw fail(403, 'An authenticator or unused recovery code is required.');
    const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    const result = await model(actor).updateOne({ _id: entity._id, passwordHash: entity.passwordHash, ...versionFilter(entity) }, { $set: { passwordHash, refreshTokenHash: null }, $unset: { passwordResetToken: '', passwordResetExpires: '', mfaPendingSecret: '', mfaPendingExpires: '' }, $inc: { sessionVersion: 1 } });
    if (!result.modifiedCount) throw fail(409, 'Your account changed. Sign in again and retry.');
    clearRefresh(res); require('./mediaSession').clear(res); await event(entity, actor, 'password_changed', req);
    const mail = require('./mailer'); if (mail.configured()) mail.queue(() => mail.sendSecurityNotice(entity.email, 'Your password changed and all sessions were signed out.'));
    res.json({ success: true, message: 'Password changed. Sign in again.' });
  } catch (error) { next(error); }
}
module.exports = { hash, fields, model, actorOf, versionFilter, setRefresh, clearRefresh, refreshFrom, totp, factor, codes, reauthenticate, publicJSON, event, dummy, encrypt, decrypt, changePassword };
