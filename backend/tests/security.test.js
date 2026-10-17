const request = require('supertest');
const jwt = require('jsonwebtoken');
const Admin = require('../src/models/Admin');
const User = require('../src/models/User');
const Settings = require('../src/models/Settings');
const Series = require('../src/models/Series');
const app = require('../src/server');

beforeAll(() => { process.env.JWT_SECRET = 'test-access-secret-32-characters-long'; });
afterEach(() => jest.restoreAllMocks());
test('anonymous callers cannot retrieve arbitrary private chapter pages', async () => {
  const res = await request(app).get('/api/chapters/507f1f77bcf86cd799439011');
  expect(res.status).toBe(401);
});
test('development mode cannot bypass admin authorization', async () => {
  process.env.DEV_MODE = 'true';
  const find = jest.spyOn(Admin, 'findOne');
  const res = await request(app).get('/api/admin/users');
  expect(res.status).toBe(401); expect(find).not.toHaveBeenCalled(); delete process.env.DEV_MODE;
});
test('an editor without user permissions cannot manage readers', async () => {
  const admin = new Admin({ _id: '507f1f77bcf86cd799439011', name: 'Editor', email: 'editor@example.com', passwordHash: 'unused', role: 'editor', isActive: true });
  jest.spyOn(Admin, 'findById').mockReturnValue({ select: async () => admin });
  const find = jest.spyOn(User, 'paginate');
  const token = jwt.sign({ id: String(admin._id), role: 'admin' }, process.env.JWT_SECRET);
  const res = await request(app).get('/api/admin/users').set('Authorization', 'Bearer ' + token);
  expect(res.status).toBe(403); expect(find).not.toHaveBeenCalled();
});
test('registration disabled setting is enforced on the server', async () => {
  jest.spyOn(Settings, 'findById').mockReturnValue({ lean: async () => ({ allowRegistration: false }) });
  const res = await request(app).post('/api/auth/register').send({ username: 'reader', email: 'reader@example.com', password: 'password-for-test' });
  expect(res.status).toBe(403);
});
test('public chapters cannot be read through a private parent series', async () => {
  jest.spyOn(Series, 'findById').mockResolvedValue({ visibility: 'private' });
  const res = await request(app).get('/api/chapters/series/507f1f77bcf86cd799439011/1');
  expect(res.status).toBe(404);
});
test('repository and environment files are never served', async () => {
  for (const file of ['/.env', '/backend/.env', '/archive/legacy/index.html', '/package.json']) expect((await request(app).get(file)).status).toBe(404);
});
test('health probes never start a database connection', async () => {
  expect(require('mongoose').connection.readyState).toBe(0);
  expect((await request(app).get('/ready')).status).toBe(503);
});
test('guest reading can be disabled without exposing chapter pages', async () => {
  jest.spyOn(Series, 'findById').mockResolvedValue({ visibility: 'public' });
  jest.spyOn(Settings, 'findById').mockReturnValue({ lean: async () => ({ allowGuestReading: false }) });
  expect((await request(app).get('/api/chapters/series/507f1f77bcf86cd799439011/1')).status).toBe(401);
});
test('expired or revoked refresh sessions are rejected before signing tokens', async () => {
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
  jest.spyOn(User, 'findById').mockReturnValue({ select: async () => ({ isActive: false, refreshTokenHash: 'revoked' }) });
  const refreshToken = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'user' }, process.env.JWT_REFRESH_SECRET);
  expect((await request(app).post('/api/auth/refresh').send({ refreshToken })).status).toBe(401);
});
test('reading position outside the actual chapter is rejected', async () => {
  const Chapter = require('../src/models/Chapter');
  const id = '507f1f77bcf86cd799439011';
  jest.spyOn(User, 'findById').mockReturnValue({ select: async () => ({ _id: id, isActive: true, preferences: {} }) });
  jest.spyOn(Series, 'findById').mockResolvedValue({ visibility: 'public' });
  jest.spyOn(Settings, 'findById').mockReturnValue({ lean: async () => ({}) });
  jest.spyOn(Chapter, 'findOne').mockResolvedValue({ pages: [{}, {}] });
  const write = jest.spyOn(User, 'findByIdAndUpdate');
  const token = jwt.sign({ id, role: 'user' }, process.env.JWT_SECRET);
  const res = await request(app).post('/api/users/reading-progress').set('Authorization', 'Bearer ' + token).send({ seriesId: id, chapterId: '507f1f77bcf86cd799439012', page: 99, completion: 50 });
  expect(res.status).toBe(400); expect(write).not.toHaveBeenCalled();
});
test('catalog search treats regex syntax as literal input', async () => {
  jest.spyOn(Settings, 'findById').mockReturnValue({ lean: async () => ({}) });
  const paginate = jest.spyOn(Series, 'paginate').mockResolvedValue({ docs: [], page: 1, totalDocs: 0, totalPages: 1 });
  await request(app).get('/api/series?q=a.*').expect(200);
  const regex = paginate.mock.calls[0][0].$or[0].title;
  expect(regex.test('a.*')).toBe(true); expect(regex.test('aaaa')).toBe(false);
});
