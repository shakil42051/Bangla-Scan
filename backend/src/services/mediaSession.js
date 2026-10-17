'use strict';
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const COOKIE = 'bs_media';
const options = () => ({ httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api/media' });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function issue(res, entity, actor, refreshToken) {
  const token = jwt.sign({ sub: String(entity._id), actor, session: hash(refreshToken) }, process.env.JWT_SECRET, { audience: 'comic-media', expiresIn: '7d' });
  res.cookie(COOKIE, token, { ...options(), maxAge: 7 * 86400000 });
}
function clear(res) { res.clearCookie(COOKIE, options()); }
async function load(req, res, next) {
  if (req.user) return next();
  const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='));
  if (!cookie) return next();
  try {
    const token = jwt.verify(decodeURIComponent(cookie.slice(COOKIE.length + 1)), process.env.JWT_SECRET, { audience: 'comic-media' });
    if (!['reader', 'admin'].includes(token.actor)) return next();
    const Model = require('../models/' + (token.actor === 'admin' ? 'Admin' : 'User'));
    const entity = await Model.findById(token.sub).select('+refreshTokenHash');
    if (entity?.isActive && entity.refreshTokenHash === token.session) { req.user = entity; req.isAdmin = token.actor === 'admin'; if (req.isAdmin) req.admin = entity; }
  } catch { /* Invalid or revoked media sessions receive guest access rules. */ }
  next();
}
module.exports = { issue, clear, load };
