'use strict';
const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { fail } = require('../utils/http');
const ID = '000000000000000000000002';
let connection, signature;
function close() { connection?.destroy(); connection = null; signature = null; }
function configured() { return Boolean(process.env.S3_BUCKET && process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY); }
function client() {
  if (!configured()) throw fail(503, 'Configure the S3 bucket, region and credentials in the server environment first.');
  if (process.env.S3_ENDPOINT) {
    const endpoint = new URL(process.env.S3_ENDPOINT);
    if (endpoint.username || endpoint.password || !['https:', ...(process.env.NODE_ENV === 'production' ? [] : ['http:'])].includes(endpoint.protocol)) throw fail(503, 'S3 requires a valid HTTPS endpoint in production.');
  }
  const options = { region: process.env.S3_REGION, endpoint: process.env.S3_ENDPOINT || undefined, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY, sessionToken: process.env.S3_SESSION_TOKEN || undefined }, maxAttempts: 2, requestHandler: { requestTimeout: 20000, connectionTimeout: 5000 } };
  const nextSignature = crypto.createHash('sha256').update(JSON.stringify(options)).digest('hex');
  if (!connection || signature !== nextSignature) { close(); connection = new S3Client(options); signature = nextSignature; }
  return connection;
}
function key(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw fail(400, 'Invalid object identifier.');
  return (process.env.S3_PREFIX || 'bangla-scan/').replace(/\/*$/, '/') + id;
}
async function send(command) { return client().send(command); }
async function upload(buffer, mimeType) {
  const fileId = crypto.randomUUID();
  await send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key(fileId), Body: buffer, ContentType: mimeType, CacheControl: 'private, no-store' }));
  return { fileId, driveId: ID, driveAccountName: process.env.S3_PROVIDER_LABEL || 'S3 compatible', url: '/api/media/' + fileId, size: buffer.length };
}
async function read(id) {
    const objectKey = key(id);
    const result = await client().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey }));
    if (Number(result.ContentLength) > 10 * 1024 * 1024) { result.Body.destroy(); throw fail(413, 'Stored image exceeds the image limit.'); }
    let size = 0; const chunks = [];
    for await (const chunk of result.Body) { size += chunk.length; if (size > 10 * 1024 * 1024) { result.Body.destroy(); throw fail(413, 'Stored image exceeds the image limit.'); } chunks.push(chunk); }
    return Buffer.concat(chunks);
}
const remove = id => send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key(id) }));
const check = () => send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }));
module.exports = { ID, configured, upload, read, remove, check, close };
