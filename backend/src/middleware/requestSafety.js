'use strict';
// Reject MongoDB operators and prototype keys before input reaches any query builder.
function unsafe(value, depth = 0) {
  if (depth > 15) return true;
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => key.startsWith('$') || key.includes('.') || ['__proto__', 'constructor', 'prototype'].includes(key) || unsafe(child, depth + 1));
}
module.exports = (req, res, next) => {
  if (unsafe(req.body) || unsafe(req.query)) return res.status(400).json({ success: false, message: 'Invalid request fields.' });
  next();
};
