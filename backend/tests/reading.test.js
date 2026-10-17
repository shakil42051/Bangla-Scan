const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Series = require('../src/models/Series');
const Settings = require('../src/models/Settings');
const Chapter = require('../src/models/Chapter');
const Activity = require('../src/models/ReadActivity');
const Comment = require('../src/models/Comment');
const app = require('../src/server');
const id = '507f1f77bcf86cd799439011';
const chapterId = '507f1f77bcf86cd799439012';
beforeAll(() => { process.env.JWT_SECRET = 'test-access-secret-32-characters-long'; });
afterEach(() => jest.restoreAllMocks());
const reader = () => {
  jest.spyOn(User, 'findById').mockReturnValue({ select: async () => ({ _id: id, isActive: true, preferences: { timezone: 'Asia/Dhaka' } }) });
  return 'Bearer ' + jwt.sign({ id, role: 'user' }, process.env.JWT_SECRET);
};
const publicSeries = settings => {
  jest.spyOn(Series, 'findById').mockResolvedValue({ visibility: 'public' });
  jest.spyOn(Settings, 'findById').mockReturnValue({ lean: async () => settings || {} });
};
test('comic chapter history requires authentication', async () => {
  for (const route of ['history']) await request(app).get('/api/reading/' + route).expect(401);
});
test('progress stores a validated set of viewed pages with an idempotent database update', async () => {
  const token = reader(); publicSeries();
  jest.spyOn(Chapter, 'findOne').mockResolvedValue({ chapterNumber: 2, pages: [{}, {}, {}] });
  jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
  const write = jest.spyOn(Activity, 'updateOne').mockResolvedValue({});
  await request(app).post('/api/users/reading-progress').set('Authorization', token).send({ seriesId: id, chapterId, page: 3, completion: 100, pagesViewed: [1, 2, 2, 3] }).expect(200);
  expect(write.mock.calls[0][1]).toEqual({ $set: { seriesId: id, completed: true }, $addToSet: { pages: { $each: [1, 2, 3] } } });
  expect(write.mock.calls[0][2].upsert).toBe(true);
});
test('batched progress cannot count pages outside a chapter', async () => {
  const token = reader(); publicSeries();
  jest.spyOn(Chapter, 'findOne').mockResolvedValue({ chapterNumber: 2, pages: [{}, {}] });
  const write = jest.spyOn(Activity, 'updateOne');
  await request(app).post('/api/users/reading-progress').set('Authorization', token).send({ seriesId: id, chapterId, page: 1, completion: 50, pagesViewed: [1, 999] }).expect(400);
  expect(write).not.toHaveBeenCalled();
});
test('paused history keeps chapter progress without creating new activity records', async () => {
  const token = reader(); publicSeries();
  User.findById.mockReturnValue({ select: async () => ({ _id: id, isActive: true, preferences: { recordHistory: false } }) });
  jest.spyOn(Chapter, 'findOne').mockResolvedValue({ chapterNumber: 2, pages: [{}] });
  const progress = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
  const activity = jest.spyOn(Activity, 'updateOne');
  await request(app).post('/api/users/reading-progress').set('Authorization', token).send({ seriesId: id, chapterId, page: 1, completion: 100 }).expect(200);
  expect(progress).toHaveBeenCalled(); expect(activity).not.toHaveBeenCalled();
});
test('publisher can disable new comments on the server', async () => {
  const token = reader(); publicSeries({ commentsEnabled: false }); const create = jest.spyOn(Comment, 'create');
  await request(app).post('/api/comments').set('Authorization', token).send({ seriesId: id, content: 'Test discussion' }).expect(403);
  expect(create).not.toHaveBeenCalled();
});
test('downloads cannot bypass publisher settings', async () => {
  publicSeries({ downloadsEnabled: false });
  jest.spyOn(Chapter, 'findOne').mockResolvedValue({ seriesId: id, pages: [{ fileId: 'private' }] });
  await request(app).get('/api/chapters/' + chapterId + '/download').expect(403);
});

test('CBZ export reads authenticated storage and uses natural page order', async () => {
  publicSeries({ downloadsEnabled: true });
  jest.spyOn(Chapter, 'findOne').mockResolvedValue({ seriesId: id, chapterNumber: 2, pages: [{ order: 2, fileId: 'png', driveId: 'drive' }, { order: 1, fileId: 'jpg', driveId: 'drive' }] });
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); const jpg = Buffer.from([255, 216, 255, 0]);
  const get = jest.fn(async ({ fileId }) => ({ data: fileId === 'png' ? png : jpg }));
  jest.spyOn(require('../src/services/driveManager'), 'getClient').mockResolvedValue({ files: { get } });
  const response = await request(app).get('/api/chapters/' + chapterId + '/download').buffer(true).parse((res, done) => {
    const data = []; res.on('data', chunk => data.push(chunk)); res.on('end', () => done(null, Buffer.concat(data))); res.on('error', done);
  }).expect(200);
  const archive = new (require('adm-zip'))(response.body);
  expect(archive.getEntries().map(entry => entry.entryName)).toEqual(['0001.jpg', '0002.png']);
  expect(get.mock.calls.map(([input]) => input.fileId)).toEqual(['jpg', 'png']);
  expect(response.headers['content-disposition']).toContain('.cbz');
});
