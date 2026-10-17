'use strict';
const { body } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const Settings = require('../models/Settings');
const mailer = require('../services/mailer');
const mediaSession = require('../services/mediaSession');
const security = require('../services/accountSecurity');
const throttle = require('../services/authThrottle');
const bcrypt = require('bcryptjs');
const tokenHash = token => crypto.createHash('sha256').update(token).digest('hex');

// ── Register ──────────────────────────────────────────────────────────────────
exports.registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Invalid username'),
  body('email').isString().trim().isLength({ max: 254 }).isEmail().customSanitizer(value => value.toLowerCase()),
  body('password').custom(require('../utils/passwordPolicy')).withMessage('Use at least 12 characters and at most 72 UTF-8 bytes.'),
  body('confirmPassword').optional().custom((value, { req }) => value === req.body.password).withMessage('The passwords do not match.'),
  body('name').optional().trim().isLength({ max: 80 }),
];

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, name } = req.body;
    const settings = await Settings.findById('global').lean();
    if (settings?.allowRegistration === false) return res.status(403).json({ success: false, message: 'Registration is currently closed.' });
    if (settings?.requireEmailVerification && !mailer.configured()) return res.status(503).json({ success: false, message: 'Email service is not configured. Please try again later.' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Those account details are unavailable. Sign in or use account recovery if you already registered.' });
    }

    const verificationToken = settings?.requireEmailVerification ? crypto.randomBytes(32).toString('hex') : null;
    const user = await User.create({
      username, email, name,
      ...(verificationToken ? { emailVerificationToken: tokenHash(verificationToken), emailVerificationExpires: new Date(Date.now() + 86400000) } : {}),
      passwordHash: password, // pre-save hook hashes it
    });

    const accessToken = signAccessToken({ id: user._id, role: 'user', ver: user.sessionVersion || 0 });
    const refreshToken = signRefreshToken({ id: user._id, role: 'user', ver: user.sessionVersion || 0 });

    // Store hashed refresh token
    user.refreshTokenHash = tokenHash(refreshToken);
    await user.save({ validateBeforeSave: false });

    let verificationEmailSent = false;
    if (verificationToken) {
      try { await mailer.sendVerificationMail(email, verificationToken, process.env.PUBLIC_URL || 'http://localhost:5000'); verificationEmailSent = true; }
      catch (error) { logger.warn('Account created; verification email delivery failed.'); }
    }
    mediaSession.issue(res, user, 'reader', refreshToken);
    security.setRefresh(res, refreshToken);
    res.status(201).json({
      success: true,
      message: 'Account created.',
      data: { user: user.toPublicJSON(), accessToken, verificationEmailSent },
    });
  } catch (err) { next(err); }
};

// Login accepts a reader username or email; content-team accounts use email.
exports.loginValidation = [
  body('email').optional().isString().trim().isLength({ min: 3, max: 254 }).isEmail(),
  body('identifier').optional().isString().trim().isLength({ min: 3, max: 254 }).custom(value => /^[A-Za-z0-9_]{3,30}$/.test(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
  body().custom(value => typeof (value.identifier || value.email) === 'string'),
  body('password').isString().isLength({ min: 1, max: 128 }),
  body('code').optional().isString().isLength({ max: 32 }),
];
exports.adminLoginValidation = exports.loginValidation;
async function signIn(req, res, next, role) {
  try {
    const identity = (req.body.identifier || req.body.email).trim(); const scope = 'login:' + role;
    if (!await throttle.spend(scope, identity)) return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Wait 15 minutes before trying again.' });
    const filter = identity.includes('@') ? { email: identity.toLowerCase() } : role === 'user' && /^[A-Za-z0-9_]{3,30}$/.test(identity) ? { username: identity } : { _id: null };
    const entity = await security.model(role).findOne(filter).select(security.fields + ' +refreshTokenHash');
    const valid = entity ? await entity.comparePassword(req.body.password) : await bcrypt.compare(req.body.password, security.dummy);
    if (!entity || !valid || !entity.isActive) return res.status(401).json({ success: false, message: 'The sign-in details are incorrect or the account is unavailable.' });
    if (!await throttle.spend('account:' + role, String(entity._id))) return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Wait 15 minutes before trying again.' });
    if (entity.twoFactorEnabled && !req.body.code) return res.status(202).json({ success: true, data: { requiresTwoFactor: true }, message: 'Enter an authenticator or recovery code.' });
    if (!await security.factor(entity, role, req.body.code)) return res.status(401).json({ success: false, message: 'The authenticator or recovery code is invalid or already used.' });
    const payload = { id: entity._id, role, ver: entity.sessionVersion || 0, ...(role === 'admin' ? { adminRole: entity.role } : {}) };
    const accessToken = signAccessToken(payload); const refreshToken = signRefreshToken({ id: entity._id, role, ver: entity.sessionVersion || 0 });
    entity.refreshTokenHash = tokenHash(refreshToken); entity.lastLoginAt = new Date(); entity.loginCount = (entity.loginCount || 0) + 1;
    await entity.save({ validateBeforeSave: false });
    await Promise.all([throttle.clear(scope, identity), throttle.clear('account:' + role, String(entity._id))]);
    mediaSession.issue(res, entity, role === 'admin' ? 'admin' : 'reader', refreshToken); security.setRefresh(res, refreshToken);
    await security.event(entity, role, 'sign_in', req);
    res.json({ success: true, data: { [role === 'admin' ? 'admin' : 'user']: entity.toPublicJSON(), accessToken } });
  } catch (error) { next(error); }
}
exports.login = (req, res, next) => signIn(req, res, next, 'user');
exports.adminLogin = (req, res, next) => signIn(req, res, next, 'admin');

// ── Refresh Token ─────────────────────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = security.refreshFrom(req);
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    let decoded;
    try { decoded = verifyRefreshToken(refreshToken); }
    catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const Model = decoded.role === 'admin' ? Admin : User;
    const entity = await Model.findById(decoded.id).select('+refreshTokenHash +sessionVersion');
    if (!entity || !entity.isActive || !entity.refreshTokenHash) {
      return res.status(401).json({ success: false, message: 'Account not found.' });
    }

    const valid = entity.refreshTokenHash === tokenHash(refreshToken) && (entity.sessionVersion || 0) === (decoded.ver || 0);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked.' });
    }

    const newAccessToken = signAccessToken({
      id: entity._id,
      role: decoded.role,
      ver: entity.sessionVersion || 0,
      ...(decoded.role === 'admin' ? { adminRole: entity.role } : {}),
    });
    const newRefreshToken = signRefreshToken({ id: entity._id, role: decoded.role, ver: entity.sessionVersion || 0 });
    // Compare and swap: concurrent replay of one refresh token cannot create two sessions.
    const rotated = await Model.updateOne({ _id: entity._id, refreshTokenHash: tokenHash(refreshToken), isActive: true, $or: [{ sessionVersion: decoded.ver || 0 }, ...(decoded.ver ? [] : [{ sessionVersion: { $exists: false } }])] }, { $set: { refreshTokenHash: tokenHash(newRefreshToken) } });
    if (!rotated.modifiedCount) return res.status(401).json({ success: false, message: 'Refresh token already used or revoked.' });

    mediaSession.issue(res, entity, decoded.role === 'admin' ? 'admin' : 'reader', newRefreshToken);
    security.setRefresh(res, newRefreshToken);
    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) { next(err); }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const entity = req.user || req.admin;
    if (entity) {
      const Model = req.isAdmin ? Admin : User;
      await Model.findByIdAndUpdate(entity._id, { $set: { refreshTokenHash: null }, $inc: { sessionVersion: 1 } });
    }
    mediaSession.clear(res); security.clearRefresh(res);
    res.json({ success: true, message: 'Logged out.' });
  } catch (err) { next(err); }
};

// ── Get current session ───────────────────────────────────────────────────────
exports.me = async (req, res) => {
  const entity = req.isAdmin ? req.admin : req.user;
  res.json({ success: true, data: entity.toPublicJSON ? entity.toPublicJSON() : entity });
};


exports.forgot = require('./recoveryController').forgot;
exports.reset = require('./recoveryController').reset;

exports.sendVerification = async (req, res, next) => {
  try {
    if (req.isAdmin) return res.status(403).json({ success: false, message: 'This option is for reader accounts.' });
    if (!mailer.configured()) return res.status(503).json({ success: false, message: 'Email delivery is temporarily unavailable.' });
    if (req.user.isEmailVerified) return res.json({ success: true, message: 'Your email is already verified.' });
    if (!await throttle.spend('verify', String(req.user._id), 1, 60000)) return res.status(429).json({ success: false, message: 'Wait a minute before requesting another verification email.' });
    const token = crypto.randomBytes(32).toString('hex');
    await User.findByIdAndUpdate(req.user._id, { emailVerificationToken: tokenHash(token), emailVerificationExpires: new Date(Date.now() + 86400000) });
    await mailer.sendVerificationMail(req.user.email, token, process.env.PUBLIC_URL || 'http://localhost:5000');
    res.json({ success: true, message: 'Verification email sent.' });
  } catch (err) { next(err); }
};
exports.verifyEmail = async (req, res, next) => {
  try {
    const token = String(req.body.token || '');
    const user = await User.findOneAndUpdate({ emailVerificationToken: tokenHash(token), emailVerificationExpires: { $gt: new Date() } }, { isEmailVerified: true, $unset: { emailVerificationToken: '', emailVerificationExpires: '' } });
    if (!user) return res.status(400).json({ success: false, message: 'Verification link is invalid or expired.' });
    res.json({ success: true, message: 'Email verified. You can now read.' });
  } catch (err) { next(err); }
};
