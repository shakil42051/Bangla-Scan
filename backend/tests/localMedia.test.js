'use strict';
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const jwt = require('jsonwebtoken');
const local = require('../src/services/localStorage');
const mediaSession = require('../src/services/mediaSession');
let directory;
const originalDirectory = process.env.MEDIA_DIRECTORY;
beforeAll(async () => { directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bangla-scan-media-test-')); process.env.MEDIA_DIRECTORY = directory; });
afterAll(async () => {
  if (path.dirname(path.resolve(directory)) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith('bangla-scan-media-test-')) await fs.rm(directory, { recursive: true, force: true });
  if (originalDirectory === undefined) delete process.env.MEDIA_DIRECTORY; else process.env.MEDIA_DIRECTORY = originalDirectory;
});
test('stores exact media bytes under an opaque identifier and removes them', async () => {
  const source = Buffer.from('disposable test bytes');
  const uploaded = await local.upload(source);
  expect(uploaded.driveId).toBe(local.LOCAL_ID);
  expect(uploaded.url).toBe('/api/media/' + uploaded.fileId);
  expect(path.dirname(local.filePath(uploaded.fileId))).toBe(directory);
  expect(await local.read(uploaded.fileId)).toEqual(source);
  await local.remove(uploaded.fileId);
  await expect(local.read(uploaded.fileId)).rejects.toHaveProperty('code', 'ENOENT');
});
test.each(['../.env', '..\\.env', 'C:\\secrets', '/etc/passwd', 'bad-id', '00000000-0000-0000-0000-000000000000'])('rejects invalid media identifier %s before accessing disk', value => {
  expect(() => local.filePath(value)).toThrow('Invalid media identifier');
});
test('media cookies are HTTP-only, scoped, audience restricted and cannot act as API tokens', () => {
  const oldSecret = process.env.JWT_SECRET; process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters';
  const response = { cookie: jest.fn() };
  try {
    mediaSession.issue(response, { _id: '507f1f77bcf86cd799439011' }, 'reader', 'test-refresh-token');
    const [name, token, options] = response.cookie.mock.calls[0];
    expect(name).toBe('bs_media'); expect(options).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/api/media' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { audience: 'comic-media' });
    expect(payload).toMatchObject({ sub: '507f1f77bcf86cd799439011', actor: 'reader' });
    expect(payload.session).toMatch(/^[a-f0-9]{64}$/); expect(payload.id).toBeUndefined(); expect(payload.role).toBeUndefined();
    expect(() => jwt.verify(token, process.env.JWT_SECRET, { audience: 'another-service' })).toThrow();
  } finally { if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; }
});
