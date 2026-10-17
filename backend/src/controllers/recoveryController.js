'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mail = require('../services/mailer');
const security = require('../services/accountSecurity');
const throttle = require('../services/authThrottle');
const { fail } = require('../utils/http');
const generic = 'If the supplied details match an active account, an email will arrive with the next steps. Check spam and try again later if needed.';
const actor = req => req.body.account === 'team' ? 'admin' : 'user';
async function recover(req, res, next, username) {
  const began = Date.now();
  try {
    if (!mail.configured()) throw fail(503, 'Account recovery email is unavailable. Contact the site team to configure email delivery.');
    // Validate the public URL before issuing any token; never derive links from Host headers.
    mail.link('login');
    const email = req.body.email.trim().toLowerCase(); const role = actor(req);
    const admitted = await throttle.spend((username ? 'username:' : 'recovery:') + role, email, 1, 60000);
    const Model = security.model(role);
    const entity = admitted ? await Model.findOne({ email, isActive: true }) : null;
    if (entity && (!username || role === 'user')) {
      if (username) mail.queue(() => mail.sendUsernameReminder(entity.email, entity.username));
      else {
        const token = crypto.randomBytes(32).toString('hex');
        await Model.updateOne({ _id: entity._id, isActive: true }, { $set: { passwordResetToken: security.hash(token), passwordResetExpires: new Date(Date.now() + 30 * 60000) } });
        mail.queue(() => mail.sendPasswordResetMail(entity.email, token, process.env.PUBLIC_URL || 'http://localhost:5000', role));
      }
    }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 350 + crypto.randomInt(50) - (Date.now() - began))));
    res.json({ success: true, message: generic });
  } catch (error) { next(error); }
}
exports.forgot = (req, res, next) => recover(req, res, next, false);
exports.username = (req, res, next) => recover(req, res, next, true);
exports.reset = async (req, res, next) => {
  try {
    const { token, password, code } = req.body; const role = actor(req); const Model = security.model(role);
    if (!await throttle.spend('reset:' + role, token, 10)) throw fail(429, 'Too many recovery attempts. Wait before trying again.');
    const filter = { passwordResetToken: security.hash(token), passwordResetExpires: { $gt: new Date() }, isActive: true };
    const entity = await Model.findOne(filter).select(security.fields);
    if (!entity) throw fail(400, 'This recovery link is invalid, already used or expired. Request a new one.');
    if (entity.twoFactorEnabled && !code) return res.status(202).json({ success: true, data: { requiresTwoFactor: true }, message: 'Enter an authenticator or recovery code to continue.' });
    if (!await security.factor(entity, role, code)) throw fail(400, 'The authenticator or recovery code is invalid or already used.');
    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await Model.updateOne({ _id: entity._id, ...filter, ...security.versionFilter(entity) }, { $set: { passwordHash, refreshTokenHash: null }, $unset: { passwordResetToken: '', passwordResetExpires: '', mfaPendingSecret: '', mfaPendingExpires: '' }, $inc: { sessionVersion: 1 } });
    if (!updated.modifiedCount) throw fail(400, 'This recovery link has already been used. Request a new one.');
    security.clearRefresh(res); require('../services/mediaSession').clear(res);
    await security.event(entity, role, 'password_reset', req);
    if (mail.configured()) mail.queue(() => mail.sendSecurityNotice(entity.email, 'Your password was reset and all sessions were signed out. Two-step verification remains enabled if it was previously set up.'));
    res.json({ success: true, message: 'Password restored. Sign in with your new password.' });
  } catch (error) { next(error); }
};
