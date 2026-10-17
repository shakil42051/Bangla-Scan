'use strict';
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'bangla-scan-api' },
  transports: [
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }),
    new transports.File({ filename: path.join(logsDir, 'combined.log'), maxsize: 5242880, maxFiles: 5 }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
  }));
}

module.exports = logger;
