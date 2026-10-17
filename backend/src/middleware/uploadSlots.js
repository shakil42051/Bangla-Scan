'use strict';
let running = 0;
module.exports = (req, res, next) => {
  if (running >= 2) return res.status(429).json({ success: false, message: 'Two uploads are already running. Try again when one finishes.' });
  running++; let released = false;
  const release = () => { if (!released) { running--; released = true; } };
  res.once('finish', release); res.once('close', release); req.once('aborted', release);
  next();
};
