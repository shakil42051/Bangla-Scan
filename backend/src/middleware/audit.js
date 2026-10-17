'use strict';
module.exports = (req, res, next) => {
  res.on('finish', () => {
    if (!req.isAdmin || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
    // Never record bodies, query strings, passwords, tokens or provider credentials.
    if (require('mongoose').connection.readyState !== 1) return;
    require('../models/AuditEvent').create({ actorId: req.admin._id, actorName: req.admin.name, method: req.method, path: req.originalUrl.split('?')[0].slice(0, 250), status: res.statusCode }).catch(() => require('../utils/logger').warn('Admin activity log write failed.'));
  });
  next();
};
