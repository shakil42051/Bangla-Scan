'use strict';

// Keep hosted startup separate from the local database launcher.
function configure(env) {
  let origin;
  try {
    const url = new URL(env.PUBLIC_URL || env.RENDER_EXTERNAL_URL);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    origin = url.origin;
  } catch { throw new Error('Set PUBLIC_URL to the website HTTPS origin, or deploy with RENDER_EXTERNAL_URL.'); }
  const driver = env.STORAGE_DRIVER || 's3';
  if (!['s3', 'drive'].includes(driver)) throw new Error('This host requires persistent cloud media storage. Local uploads would be lost on restart.');
  if (driver === 's3' && ['S3_BUCKET', 'S3_REGION', 'S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].some(key => !env[key])) {
    throw new Error('Configure the private S3-compatible bucket, HTTPS endpoint, region and credentials before starting.');
  }
  if (driver === 's3') {
    let endpoint;
    try { endpoint = new URL(env.S3_ENDPOINT); } catch { throw new Error('S3_ENDPOINT must be a valid HTTPS URL.'); }
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('S3_ENDPOINT must be a valid HTTPS URL without embedded credentials.');
  }
  if (!env.MONGODB_URI) throw new Error('Configure MONGODB_URI for the persistent production database.');
  return {
    NODE_ENV: 'production', HOST: env.HOST || '0.0.0.0',
    PUBLIC_URL: origin, CLIENT_URL: env.CLIENT_URL || origin,
    STORAGE_DRIVER: driver, REQUIRE_PERSISTENT_MEDIA: 'true',
  };
}

async function main() {
  require('dotenv').config({ path: process.env.BANGLA_SCAN_ENV_FILE || require('path').join(__dirname, '../.env') });
  Object.assign(process.env, configure(process.env));
  await require('./server').start();
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { configure };
