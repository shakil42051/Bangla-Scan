jest.mock('../src/models/Settings', () => ({ findById: jest.fn() }));
jest.mock('../src/services/localStorage', () => ({ upload: jest.fn() }));
jest.mock('../src/services/s3Storage', () => ({ upload: jest.fn().mockResolvedValue({ fileId: 'cloud-page' }) }));
const { configure } = require('../src/hosted');
const Settings = require('../src/models/Settings');
const storage = require('../src/services/storageProvider');
const cloud = {
  RENDER_EXTERNAL_URL: 'https://example.onrender.com', MONGODB_URI: 'mongodb://database/example',
  STORAGE_DRIVER: 's3', S3_BUCKET: 'comic-pages', S3_REGION: 'test-region',
  S3_ENDPOINT: 'https://storage.example.com/storage/v1/s3',
  S3_ACCESS_KEY_ID: 'test-access', S3_SECRET_ACCESS_KEY: 'test-secret',
};
const previousPersistence = process.env.REQUIRE_PERSISTENT_MEDIA;
afterEach(() => {
  jest.clearAllMocks();
  if (previousPersistence === undefined) delete process.env.REQUIRE_PERSISTENT_MEDIA;
  else process.env.REQUIRE_PERSISTENT_MEDIA = previousPersistence;
});
test('hosted startup uses the real HTTPS origin for same-site sessions and recovery', () => {
  expect(configure(cloud)).toMatchObject({ HOST: '0.0.0.0', PUBLIC_URL: cloud.RENDER_EXTERNAL_URL, CLIENT_URL: cloud.RENDER_EXTERNAL_URL, NODE_ENV: 'production', REQUIRE_PERSISTENT_MEDIA: 'true' });
});
test('hosted startup refuses missing persistent services and unsafe origins', () => {
  for (const override of [{ STORAGE_DRIVER: 'local' }, { MONGODB_URI: '' }, { S3_SECRET_ACCESS_KEY: '' }, { S3_ENDPOINT: 'http://storage.example.com' }, { PUBLIC_URL: 'http://example.com' }, { PUBLIC_URL: 'https://user:secret@example.com' }, { PUBLIC_URL: 'https://example.com/subpath' }]) {
    expect(() => configure({ ...cloud, ...override })).toThrow();
  }
});
test('a saved local-storage preference cannot silently lose uploads on an ephemeral host', async () => {
  process.env.REQUIRE_PERSISTENT_MEDIA = 'true';
  Settings.findById.mockReturnValue({ select: () => ({ lean: async () => ({ storageDriver: 'local' }) }) });
  await expect(storage.upload(Buffer.from('page'), 'page.png', 'image/png')).rejects.toMatchObject({ statusCode: 503 });
  expect(require('../src/services/localStorage').upload).not.toHaveBeenCalled();
});
test('cloud uploads remain available when persistent storage is required', async () => {
  process.env.REQUIRE_PERSISTENT_MEDIA = 'true';
  Settings.findById.mockReturnValue({ select: () => ({ lean: async () => ({ storageDriver: 's3' }) }) });
  await expect(storage.upload(Buffer.from('page'), 'page.png', 'image/png')).resolves.toEqual({ fileId: 'cloud-page' });
});
