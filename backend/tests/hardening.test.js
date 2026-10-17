const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../src/models/Admin');
const User = require('../src/models/User');
const Settings = require('../src/models/Settings');
const Upload = require('../src/models/Upload');
const Chapter = require('../src/models/Chapter');
const Series = require('../src/models/Series');
const app = require('../src/server');
const id = '507f1f77bcf86cd799439011';
beforeAll(() => { process.env.JWT_SECRET = 'test-access-secret-32-characters-long'; process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long'; });
afterEach(() => jest.restoreAllMocks());
const token = (role = 'user', ver = 0) => 'Bearer ' + jwt.sign({ id, role, ver }, process.env.JWT_SECRET);
const reader = (version = 0) => jest.spyOn(User, 'findById').mockReturnValue({ select: async () => ({ _id: id, isActive: true, sessionVersion: version, preferences: {} }) });
const team = permission => jest.spyOn(Admin, 'findById').mockReturnValue({ select: async () => ({ _id: id, isActive: true, hasPermission: permission, role: 'editor' }) });
test('operators and prototype keys are rejected before database queries', async () => {
  const find = jest.spyOn(User, 'findOne');
  for (const payload of [{ email: { $ne: null }, password: 'password' }, JSON.parse('{"constructor":{"prototype":{"isAdmin":true}}}')]) await request(app).post('/api/auth/login').send(payload).expect(400);
  expect(find).not.toHaveBeenCalled();
});
test('validation never logs passwords or submitted request bodies', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const res = await request(app).post('/api/auth/login').send({ email: 'bad-email', password: 'secret-that-must-not-be-logged' });
  expect(res.status).toBe(422); expect(log).not.toHaveBeenCalled();
  expect(JSON.stringify(res.body)).not.toContain('secret-that-must-not-be-logged');
});
test('session lookups do not exhaust the credential-attempt limit', async () => {
  for (let i = 0; i < 22; i++) await request(app).get('/api/auth/me').expect(401);
  await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' }).expect(422);
});
test('access tokens stop working as soon as the account session version changes', async () => {
  reader(2);
  await request(app).get('/api/auth/me').set('Authorization', token('user', 1)).expect(401);
});
test('logout increments the revocation version and clears the refresh session', async () => {
  reader(); const write = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
  const res = await request(app).post('/api/auth/logout').set('Authorization', token()).expect(200);
  expect(write.mock.calls[0][1]).toEqual({ $set: { refreshTokenHash: null }, $inc: { sessionVersion: 1 } });
  expect(res.headers['set-cookie'][0]).toContain('bs_media=;');
});
test('refresh rotation admits only one use of a refresh token, including concurrent requests', async () => {
  const refreshToken = jwt.sign({ id, role: 'user', ver: 0 }, process.env.JWT_REFRESH_SECRET);
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  jest.spyOn(User, 'findById').mockReturnValue({ select: async () => ({ _id: id, isActive: true, sessionVersion: 0, refreshTokenHash: hash }) });
  const update = jest.spyOn(User, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 }).mockResolvedValueOnce({ modifiedCount: 0 });
  const results = await Promise.all([request(app).post('/api/auth/refresh').send({ refreshToken }), request(app).post('/api/auth/refresh').send({ refreshToken })]);
  expect(results.map(r => r.status).sort()).toEqual([200, 401]);
  expect(update.mock.calls[0][0].refreshTokenHash).toBe(hash);
});
test('non-publishing team members cannot preview private series', async () => {
  team(() => false); jest.spyOn(Series, 'findById').mockResolvedValue({ visibility: 'draft' });
  const query = jest.spyOn(Chapter, 'findOne');
  await request(app).get('/api/chapters/series/' + id + '/1').set('Authorization', token('admin')).expect(404);
  expect(query).not.toHaveBeenCalled();
});
test('multipart fields cannot bypass operator rejection', async () => {
  team(() => true); const find = jest.spyOn(Upload, 'findOne');
  await request(app).post('/api/uploads/replace').set('Authorization', token('admin')).field('oldFileId[$ne]', 'x').attach('file', Buffer.from([255, 216, 255]), 'page.jpg').expect(400);
  expect(find).not.toHaveBeenCalled();
});
test('private remote media is rejected before contacting its storage provider', async () => {
  const provider = require('../src/services/storageProvider'); const read = jest.spyOn(provider, 'read');
  jest.spyOn(Upload, 'findOne').mockReturnValue({ lean: async () => ({ fileId: 'test-remote-image', driveAccountId: require('../src/services/s3Storage').ID, type: 'chapter_page', chapterId: id }) });
  jest.spyOn(Chapter, 'findOne').mockReturnValue({ lean: async () => null });
  await request(app).get('/api/media/test-remote-image').expect(404);
  expect(read).not.toHaveBeenCalled();
});
test('chapter reports require a reader and use the authenticated reader identity', async () => {
  await request(app).post('/api/reports').send({}).expect(401);
  reader(); jest.spyOn(Series, 'findById').mockResolvedValue({ visibility: 'public' });
  jest.spyOn(Settings, 'findById').mockReturnValue({ lean: async () => ({}) });
  const create = jest.spyOn(require('../src/models/IssueReport'), 'create').mockResolvedValue({});
  await request(app).post('/api/reports').set('Authorization', token()).send({ seriesId: id, userId: '507f1f77bcf86cd799439012', reason: 'wrong_order', details: 'Pages reversed' }).expect(201);
  expect(String(create.mock.calls[0][0].userId)).toBe(id);
});
test('new passwords cannot be silently truncated by bcrypt, including Bengali text', () => {
  const valid = require('../src/utils/passwordPolicy');
  expect(valid('aB7!'.repeat(18))).toBe(true); expect(valid('aB7!'.repeat(18) + 'x')).toBe(false);
  expect(valid('ব'.repeat(25))).toBe(false); expect(valid({ length: 10 })).toBe(false);
});
test('encrypted provider secrets are authenticated and reject tampering', () => {
  const { encrypt, decrypt } = require('../src/services/credentialCrypto'); const encrypted = encrypt('private-provider-secret');
  expect(encrypted).not.toContain('private-provider-secret'); expect(decrypt(encrypted)).toBe('private-provider-secret');
  const parts = encrypted.split(':'); parts[2] = '00'.repeat(16);
  expect(() => decrypt(parts.join(':'))).toThrow('could not be decrypted');
});
test('settings administration and storage controls cannot be used by readers', async () => {
  reader();
  await request(app).get('/api/admin/storage').set('Authorization', token()).expect(403);
  await request(app).get('/api/admin/audit').set('Authorization', token()).expect(403);
  await request(app).patch('/api/admin/reports/' + id).set('Authorization', token()).send({ status: 'resolved' }).expect(403);
});
