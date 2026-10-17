'use strict';
/**
 * DriveManager — Singleton persistent Google Drive connection manager.
 *
 * Responsibilities:
 *  - Build & cache authenticated Drive clients per account.
 *  - Validate credentials on startup and on each health-check.
 *  - Auto-reconnect disconnected drives without admin intervention.
 *  - Expose health status so the admin dashboard can display real-time state.
 */

const { google } = require('googleapis');
const { Readable } = require('stream');
const DriveAccount = require('../models/DriveAccount');
const logger = require('../utils/logger');

// ── In-memory client cache (Map<accountId, { drive, expiresAt }>) ─────────────
const _clientCache = new Map();
const CLIENT_CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes (before OAuth2 token expires)

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an authenticated Google Drive client from a DriveAccount document.
 * The doc MUST have secrets selected (use `.select('+clientSecret +refreshToken +privateKey')`).
 */
function _buildClient(account) {
  if (account.authType === 'service_account') {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: account.clientEmail,
        private_key:  account.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
  }

  // OAuth2
  const oauth2 = new google.auth.OAuth2(
    account.clientId,
    account.clientSecret,
    'urn:ietf:wg:oauth:2.0:oob',
  );
  oauth2.setCredentials({ refresh_token: account.refreshToken });
  return google.drive({ version: 'v3', auth: oauth2 });
}

/**
 * Get (or rebuild) a Drive client for the given account.
 * Uses in-memory cache to avoid rebuilding on every request.
 */
async function _getClient(accountId) {
  const cached = _clientCache.get(accountId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.drive;
  }

  // Load fresh from DB (with secrets)
  const account = await DriveAccount.findById(accountId)
    .select('+clientSecret +refreshToken +privateKey');
  if (!account) throw new Error(`DriveAccount ${accountId} not found in DB.`);
  if (!account.isActive) throw new Error(`DriveAccount ${accountId} is disabled.`);

  const drive = _buildClient(account);

  _clientCache.set(accountId, {
    drive,
    expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
  });

  return drive;
}

/**
 * Evict the cached client for an account (force rebuild on next use).
 */
function _evictClient(accountId) {
  _clientCache.delete(String(accountId));
}

/**
 * Validate a Drive client by calling the About API.
 * Returns { ok, email, storageQuota } or throws.
 */
async function _validateClient(drive) {
  const res = await drive.about.get({
    fields: 'user(emailAddress),storageQuota',
  });
  return {
    ok:           true,
    email:        res.data.user?.emailAddress,
    storageQuota: res.data.storageQuota,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DriveManager public API
// ─────────────────────────────────────────────────────────────────────────────

const DriveManager = {

  // ── Initialization ──────────────────────────────────────────────────────────

  /**
   * Called once on server startup (after DB is connected).
   * Restores active Drive accounts, warming cache. Bypasses live Google API quota
   * checks if verified healthy within the last 24 hours (highly optimizes dev restarts/hot-reloads).
   */
  async initializeAll() {
    logger.info('[DriveManager] Restoring persistent Drive accounts...');
    const accounts = await DriveAccount.find({ isActive: true })
      .select('+clientSecret +refreshToken +privateKey');

    if (!accounts.length) {
      logger.warn('[DriveManager] No active Drive accounts found in DB.');
      return;
    }

    const results = [];
    const CACHE_VALID_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours cache validity

    for (const a of accounts) {
      const id = String(a._id);
      
      const wasCheckedRecently = a.health?.lastCheckedAt && 
        (Date.now() - new Date(a.health.lastCheckedAt).getTime() < CACHE_VALID_THRESHOLD_MS);
      const isHealthy = a.health?.status === 'healthy';

      if (wasCheckedRecently && isHealthy) {
        // Fast restore: warm in-memory cache using Mongoose persistent state
        logger.info(`[DriveManager] ⚡ Restored "${a.name}" from persistent database cache.`);
        try {
          const drive = _buildClient(a);
          _clientCache.set(id, { drive, expiresAt: Date.now() + CLIENT_CACHE_TTL_MS });
          results.push({ status: 'fulfilled' });
        } catch (err) {
          logger.error(`[DriveManager] Failed to build cached client for ${a.name}: ${err.message}`);
          results.push({ status: 'rejected', reason: err });
        }
      } else {
        // Run full live Google Drive validation and save health back to DB
        try {
          await this._validateAndCache(a);
          results.push({ status: 'fulfilled' });
        } catch (err) {
          results.push({ status: 'rejected', reason: err });
        }
      }
    }

    const healthy   = results.filter((r) => r.status === 'fulfilled').length;
    const unhealthy = results.filter((r) => r.status === 'rejected').length;
    logger.info(`[DriveManager] Connection restore complete. ${healthy} healthy, ${unhealthy} failed.`);
  },

  /**
   * Validate a single account and update its health in DB.
   * Also warms the in-memory client cache.
   */
  async _validateAndCache(account) {
    const id = String(account._id);
    try {
      const drive = _buildClient(account);
      const info  = await _validateClient(drive);

      // Cache it
      _clientCache.set(id, { drive, expiresAt: Date.now() + CLIENT_CACHE_TTL_MS });

      // Update DB health
      await DriveAccount.findByIdAndUpdate(id, {
        'health.status':           'healthy',
        'health.lastCheckedAt':    new Date(),
        'health.consecutiveFails': 0,
        'health.lastError':        '',
        'meta.driveEmail':         info.email,
        'meta.storageQuota':       info.storageQuota,
        'meta.lastSyncedAt':       new Date(),
      });

      logger.info(`[DriveManager] ✅ ${account.name} (${info.email}) — healthy`);
    } catch (err) {
      _evictClient(id);

      const prev = account.health?.consecutiveFails ?? 0;
      await DriveAccount.findByIdAndUpdate(id, {
        'health.status':           'disconnected',
        'health.lastCheckedAt':    new Date(),
        'health.lastErrorAt':      new Date(),
        'health.lastError':        err.message,
        'health.consecutiveFails': prev + 1,
      });

      logger.error(`[DriveManager] ❌ ${account.name} — ${err.message}`);
      throw err;
    }
  },

  // ── Client Access ───────────────────────────────────────────────────────────

  /**
   * Get a working Drive client for a given account ID.
   * Will auto-rebuild from DB if the cache is stale.
   */
  async getClient(accountId) {
    return _getClient(accountId);
  },

  /**
   * Evict cached client (e.g., after credentials are updated).
   */
  evictClient(accountId) {
    _evictClient(String(accountId));
  },

  // ── Drive Selection ─────────────────────────────────────────────────────────

  /**
   * Pick the best available drive account:
   *   - Active, healthy (or unknown status for new accounts)
   *   - Not full (< 95% capacity)
   *   - Lowest priority number first, then least used
   */
  async pickBestDrive() {
    const account = await DriveAccount.findOne({
      isActive:       true,
      'health.status': { $in: ['healthy', 'unknown'] },
      $expr: { $lt: ['$usedBytes', { $multiply: ['$totalBytes', 0.95] }] },
    })
      .sort({ priority: 1, usedBytes: 1 })
      .select('+clientSecret +refreshToken +privateKey');

    if (account) return account;

    // Fallback: any active account (ignore health status — might still work)
    return DriveAccount.findOne({ isActive: true })
      .sort({ priority: 1, usedBytes: 1 })
      .select('+clientSecret +refreshToken +privateKey');
  },

  // ── Upload ──────────────────────────────────────────────────────────────────

  /**
   * Upload a Buffer to Google Drive.
   * Returns { fileId, driveId, driveAccountName, url, size }
   */
  async upload(buffer, fileName, mimeType, folderId = null) {
    const account = await this.pickBestDrive();
    if (!account) throw new Error('No active Google Drive account configured.');

    // Try up to 2 times (once fresh, once after evicting cache)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const drive = await _getClient(String(account._id));

        const resolvedFolder = folderId
          || account.rootFolderId
          || undefined;

        if (resolvedFolder) {
          if (!/^[A-Za-z0-9_-]{10,200}$/.test(resolvedFolder)) throw Object.assign(new Error('Use a valid private Google Drive folder ID.'), { statusCode: 400 });
          let pageToken;
          do {
            const permissions = await drive.permissions.list({ fileId: resolvedFolder, pageSize: 100, pageToken, fields: 'nextPageToken,permissions(type)', supportsAllDrives: true });
            if ((permissions.data.permissions || []).some(permission => ['anyone', 'domain'].includes(permission.type))) throw Object.assign(new Error('Choose a private Drive folder. Public or domain sharing can expose unpublished comic pages.'), { statusCode: 400 });
            pageToken = permissions.data.nextPageToken;
          } while (pageToken);
        }

        const fileMetadata = {
          name:    fileName,
          parents: resolvedFolder ? [resolvedFolder] : [],
        };

        const media = { mimeType, body: Readable.from(buffer) };

        const response = await drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id,size',
        });

        const fileId = response.data.id;
        const size   = parseInt(response.data.size || buffer.length, 10);

        // All providers use the same access-checked media endpoint, including drafts.
        const url = '/api/media/' + fileId;

        // Update usage stats
        await DriveAccount.findByIdAndUpdate(account._id, {
          $inc: { usedBytes: size, fileCount: 1 },
          lastUsedAt: new Date(),
          'health.status': 'healthy',
        }).catch(() => logger.warn('Drive image saved; usage counters will need reconciliation.'));

        logger.info(`[DriveManager] Uploaded ${fileName} → Drive[${account.name}] fileId=${fileId}`);

        return {
          fileId,
          driveId:          String(account._id),
          driveAccountName: account.name,
          url,
          size,
        };
      } catch (err) {
        if (attempt === 2 || err.statusCode) throw err;
        logger.warn(`[DriveManager] Upload attempt ${attempt} failed, retrying: ${err.message}`);
        _evictClient(String(account._id));
      }
    }
  },

  // ── Delete ──────────────────────────────────────────────────────────────────

  /**
   * Delete a file from Google Drive and update usage stats.
   */
  async delete(fileId, driveAccountId) {
    const account = await DriveAccount.findById(driveAccountId)
      .select('+clientSecret +refreshToken +privateKey');
    if (!account) throw new Error('Drive account not found.');

    const drive = await _getClient(String(account._id));

    // Get file size before deleting
    const fileMeta = await drive.files.get({ fileId, fields: 'size' }).catch(() => null);
    await drive.files.delete({ fileId });

    const size = fileMeta ? parseInt(fileMeta.data.size || 0, 10) : 0;
    await DriveAccount.findByIdAndUpdate(account._id, {
      $inc: { usedBytes: -size, fileCount: -1 },
    });

    logger.info(`[DriveManager] Deleted fileId=${fileId} from Drive[${account.name}]`);
  },

  // ── List files ──────────────────────────────────────────────────────────────

  async listFiles(driveAccountId, folderId) {
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(folderId || '')) throw Object.assign(new Error('A valid Drive folder ID is required.'), { statusCode: 400 });
    const drive = await _getClient(String(driveAccountId));
    const res = await drive.files.list({
      q:       `'${folderId}' in parents and trashed=false`,
      fields:  'files(id,name,size,mimeType,createdTime)',
      pageSize: 100,
      orderBy: 'name',
    });
    return res.data.files || [];
  },

  // ── Health Check ────────────────────────────────────────────────────────────

  /**
   * Run a health check on one or all accounts.
   * Repairs broken sessions automatically.
   */
  async healthCheckAll() {
    const accounts = await DriveAccount.find({ isActive: true })
      .select('+clientSecret +refreshToken +privateKey');

    const results = [];
    for (const account of accounts) {
      try {
        await this._validateAndCache(account);
        results.push({ id: account._id, name: account.name, status: 'healthy' });
      } catch (err) {
        results.push({ id: account._id, name: account.name, status: 'disconnected', error: err.message });
      }
    }
    return results;
  },

  async healthCheckOne(accountId) {
    const account = await DriveAccount.findById(accountId)
      .select('+clientSecret +refreshToken +privateKey');
    if (!account) throw new Error('Drive account not found.');
    await this._validateAndCache(account);
    return { id: account._id, name: account.name, status: 'healthy' };
  },

  // ── Reconnect ───────────────────────────────────────────────────────────────

  /**
   * Attempt to reconnect / repair a disconnected account.
   * Evicts the old client and re-validates from DB.
   */
  async reconnect(accountId) {
    _evictClient(String(accountId));
    return this.healthCheckOne(accountId);
  },

  // ── Validate new credentials before saving ──────────────────────────────────

  /**
   * Test Drive credentials (not yet in DB) by building a temporary client.
   * Returns { ok, email, storageQuota }
   */
  async validateCredentials({ authType, clientId, clientSecret, refreshToken, clientEmail, privateKey }) {
    let drive;
    if (authType === 'service_account') {
      const auth = new google.auth.GoogleAuth({
        credentials: { client_email: clientEmail, private_key: privateKey },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      drive = google.drive({ version: 'v3', auth });
    } else {
      const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
      oauth2.setCredentials({ refresh_token: refreshToken });
      drive = google.drive({ version: 'v3', auth: oauth2 });
    }
    return _validateClient(drive);
  },

  // ── Summary (no secrets) ────────────────────────────────────────────────────

  async getSummary() {
    const accounts = await DriveAccount.find({}).select('-clientSecret -refreshToken -privateKey');
    return accounts.map((a) => ({
      _id:              a._id,
      name:             a.name,
      email:            a.email,
      authType:         a.authType,
      clientEmail:      a.clientEmail,
      isActive:         a.isActive,
      priority:         a.priority,
      rootFolderId:     a.rootFolderId,
      chapterFolderId:  a.chapterFolderId,
      coverFolderId:    a.coverFolderId,
      usedBytes:        a.usedBytes,
      totalBytes:       a.totalBytes,
      fileCount:        a.fileCount,
      usedGB:           (a.usedBytes / 1073741824).toFixed(2),
      totalGB:          (a.totalBytes / 1073741824).toFixed(2),
      freeGB:           ((a.totalBytes - a.usedBytes) / 1073741824).toFixed(2),
      usedPercent:      ((a.usedBytes / a.totalBytes) * 100).toFixed(1),
      isFull:           a.usedBytes >= a.totalBytes * 0.95,
      lastUsedAt:       a.lastUsedAt,
      health:           a.health,
      meta:             { driveEmail: a.meta?.driveEmail, lastSyncedAt: a.meta?.lastSyncedAt },
      uploadSettings:   a.uploadSettings,
      createdAt:        a.createdAt,
      updatedAt:        a.updatedAt,
    }));
  },
};

module.exports = DriveManager;
