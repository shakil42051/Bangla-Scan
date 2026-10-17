'use strict';
require('dotenv').config({ path: process.env.BANGLA_SCAN_ENV_FILE || require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const initCrons = require('./utils/crons');
const DriveManager = require('./services/driveManager');

// Route imports
const authRoutes = require('./routes/auth');
const seriesRoutes = require('./routes/series');
const chapterRoutes = require('./routes/chapters');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admin');
const genreRoutes = require('./routes/genres');
const bookmarkRoutes = require('./routes/bookmarks');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/ratings');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');
const homepageRoutes = require('./routes/homepage');

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY_HOPS) app.set('trust proxy', Math.min(5, Math.max(1, Number(process.env.TRUST_PROXY_HOPS) || 1)));

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"],
    imgSrc: ["'self'", 'https:', ...(process.env.NODE_ENV === 'production' ? [] : ['http:'])],
    fontSrc: ["'self'"], connectSrc: ["'self'"], objectSrc: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  } },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Drive images
}));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or file:/// loads)
    if (!origin) return callback(null, true);
    const ownOrigin = `http://localhost:${process.env.PORT || 5000}`;
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    if (origin === ownOrigin) return callback(null, true);

    const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(o => o.trim());
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(Object.assign(new Error('Not allowed by CORS'), { statusCode: 403 }));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  skip: req => req.path.startsWith('/media/'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limit on auth endpoints
const authLimiter = rateLimit({
  // Routine session restoration and sign-out must not consume login-attempt limits.
  skip: req => ['/me', '/refresh', '/logout', '/revoke-sessions'].includes(req.path) || req.path === '/security' || req.path.startsWith('/security/'),
  windowMs: 15 * 60 * 1000,
  max: Math.min(200, Math.max(5, Number(process.env.AUTH_RATE_LIMIT_MAX) || 20)),
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(require('./middleware/requestSafety'));
app.use('/api', require('./middleware/audit'));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  });
});

app.get('/ready', (req, res) => {
  const ready = require('mongoose').connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable' });
});
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/media', rateLimit({ windowMs: 15 * 60 * 1000, max: 2000 }), require('./routes/media'));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reading', require('./routes/reading'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', require('./routes/adminTools'));
app.use('/api/genres', genreRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/homepage', homepageRoutes);

// Serve only intentional website assets, never repository files or environment files.
const path = require('path');
const webRoot = path.resolve(__dirname, '../..');
const siteTemplate = require('fs').readFileSync(path.join(webRoot, 'index.html'), 'utf8');
app.get('/', async (req, res, next) => {
  try {
    const settings = require('mongoose').connection.readyState === 1 ? await require('./models/Settings').findById('global').lean() : {};
    res.set('Cache-Control', 'no-cache').type('html').send(require('./services/siteDocument')(siteTemplate, settings || {}));
  } catch (error) { next(error); }
});
// Stable asset filenames must revalidate after a deployment; ETags avoid unchanged downloads.
app.use('/assets', express.static(path.join(webRoot, 'assets'), { maxAge: 0, fallthrough: false, setHeaders: res => res.setHeader('Cache-Control', 'no-cache') }));
for (const file of ['sw.js', 'manifest.json', 'bangla_scan_logo.svg']) {
  app.get('/' + file, (req, res) => res.sendFile(path.join(webRoot, file)));
}
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);

async function start() {
  if (process.env.AUTH_ENCRYPTION_KEY && process.env.AUTH_ENCRYPTION_KEY.length < 32) {
    throw new Error('Configure AUTH_ENCRYPTION_KEY with at least 32 characters, or leave it empty to use JWT_SECRET.');
  }
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32 || process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('Configure distinct JWT_SECRET and JWT_REFRESH_SECRET values of at least 32 characters.');
  }
  await connectDB();
  if (process.env.BOOTSTRAP_ADMIN === 'true' || process.env.BOOTSTRAP_LOCAL_ADMIN === 'true') await require('./services/seedData')();
  if (process.env.STORAGE_DRIVER === 'drive') await DriveManager.initializeAll();
  const jobs = initCrons();
  let server;
  try {
    server = await new Promise((resolve, reject) => {
      const listening = app.listen(process.env.PORT || 5000, process.env.HOST || '127.0.0.1', () => { listening.removeListener('error', reject); logger.info('Bangla Scan is ready.'); resolve(listening); });
      listening.once('error', reject);
    });
  } catch (error) { jobs.forEach(job => job.stop()); await require('mongoose').disconnect(); throw error; }
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    jobs.forEach(job => job.stop());
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      require('./services/s3Storage').close();
      await require('mongoose').disconnect();
      clearTimeout(timeout);
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}
if (require.main === module) start().catch(err => { logger.error(err.message); process.exitCode = 1; });
module.exports = app;
module.exports.start = start;
