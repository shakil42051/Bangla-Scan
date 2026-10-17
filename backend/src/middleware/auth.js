'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// ── Token utilities ───────────────────────────────────────────────────────────
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, jti: require('crypto').randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

function verify(token, secret) {
  if (typeof token !== 'string' || token.length > 8192) throw new Error('Invalid token.');
  const claims = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (!/^[a-f0-9]{24}$/i.test(claims.id || '') || !['user', 'admin'].includes(claims.role) || (claims.ver !== undefined && (!Number.isSafeInteger(claims.ver) || claims.ver < 0)) || claims.aud) throw new Error('Invalid token claims.');
  return claims;
}
const verifyAccessToken = token => verify(token, process.env.JWT_SECRET);
const verifyRefreshToken = token => verify(token, process.env.JWT_REFRESH_SECRET);
const currentSession = (entity, claims) => (entity.sessionVersion || 0) === (claims.ver || 0);

// ── Extract token from header ─────────────────────────────────────────────────
const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
};

// ── Middleware: protect user routes ──────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const decoded = verifyAccessToken(token);

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-passwordHash -refreshTokenHash +sessionVersion');
      if (!admin || !admin.isActive || !currentSession(admin, decoded)) {
        return res.status(401).json({ success: false, message: 'Admin account is inactive.' });
      }
      req.admin = admin;
      req.user = admin;
      req.isAdmin = true;
    } else {
      const user = await User.findById(decoded.id).select('-passwordHash -refreshTokenHash +sessionVersion');
      if (!user || !user.isActive || !currentSession(user, decoded)) {
        return res.status(401).json({ success: false, message: 'User account is inactive.' });
      }
      req.user = user;
      req.isAdmin = false;
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ── Middleware: protect admin routes ─────────────────────────────────────────
const adminProtect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin token required.' });
    }

    const decoded = verifyAccessToken(token);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only.' });
    }

    const admin = await Admin.findById(decoded.id).select('-passwordHash -refreshTokenHash +sessionVersion');
    if (!admin || !admin.isActive || !currentSession(admin, decoded)) {
      return res.status(401).json({ success: false, message: 'Admin account inactive.' });
    }

    req.admin = admin;
    req.user = admin;
    req.isAdmin = true;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid admin token.' });
  }
};

// ── Middleware: optional auth (attach user if token present) ─────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-passwordHash -refreshTokenHash +sessionVersion');
      if (admin && admin.isActive && currentSession(admin, decoded)) {
        req.admin = admin;
        req.user = admin;
        req.isAdmin = true;
      }
    } else {
      const user = await User.findById(decoded.id).select('-passwordHash -refreshTokenHash +sessionVersion');
      if (user && user.isActive && currentSession(user, decoded)) {
        req.user = user;
        req.isAdmin = false;
      }
    }
    next();
  } catch (err) {
    // Just proceed without user if token is invalid
    next();
  }
};

// ── Middleware: require specific admin permission ─────────────────────────────
const requirePermission = (perm) => (req, res, next) => {
  if (!req.admin) {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }
  if (!req.admin.hasPermission(perm)) {
    return res.status(403).json({
      success: false,
      message: `You do not have permission: ${perm}`,
    });
  }
  next();
};

module.exports = {
  protect,
  adminProtect,
  optionalAuth,
  requirePermission,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
