'use strict';
const crypto = require('crypto');
function key(secretOverride) {
  const secret = secretOverride || process.env.STORAGE_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('Configure a storage encryption secret of at least 32 characters.');
  return crypto.createHash('sha256').update(secret).digest();
}
function encrypt(text, secretOverride) {
  if (!text) return text;
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key(secretOverride), iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return ['v2', iv.toString('hex'), cipher.getAuthTag().toString('hex'), data.toString('hex')].join(':');
}
function decrypt(text, secretOverride) {
  if (!text) return text;
  try {
    const parts = text.split(':');
    if (parts[0] === 'v2') {
      if (parts.length !== 4) throw new Error();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key(secretOverride), Buffer.from(parts[1], 'hex'));
      decipher.setAuthTag(Buffer.from(parts[2], 'hex'));
      return Buffer.concat([decipher.update(Buffer.from(parts[3], 'hex')), decipher.final()]).toString('utf8');
    }
    // Read previous CBC credentials so existing connections can be migrated on save.
    if (/^[a-f0-9]{32}:[a-f0-9]+$/i.test(text)) {
      const legacy = crypto.createHash('sha256').update(process.env.JWT_SECRET || '').digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', legacy, Buffer.from(parts[0], 'hex'));
      return Buffer.concat([decipher.update(Buffer.from(parts[1], 'hex')), decipher.final()]).toString('utf8');
    }
    return text;
  } catch { throw new Error('Stored storage credentials could not be decrypted. Check the encryption key.'); }
}
module.exports = { encrypt, decrypt };
