jest.mock('@aws-sdk/client-s3', () => {
  class Command { constructor(input) { this.input = input; } }
  return { S3Client: jest.fn(() => ({ send: jest.fn(), destroy: jest.fn() })), PutObjectCommand: Command, GetObjectCommand: Command, DeleteObjectCommand: Command, HeadBucketCommand: Command };
});
const { S3Client } = require('@aws-sdk/client-s3');
const s3 = require('../src/services/s3Storage');
const original = { ...process.env };
const id = 'a737e1c9-fbda-4c78-9046-aa83675369d9';
beforeEach(() => {
  s3.close();
  Object.assign(process.env, { S3_BUCKET: 'private-comics', S3_REGION: 'auto', S3_ACCESS_KEY_ID: 'test-key', S3_SECRET_ACCESS_KEY: 'test-secret', S3_PREFIX: 'panels/', S3_ENDPOINT: 'https://storage.example.invalid', NODE_ENV: 'production' });
  S3Client.mockClear();
});
afterAll(() => { s3.close(); for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key]; Object.assign(process.env, original); });
test('uploads use an opaque key and protected application URL without a public ACL', async () => {
  S3Client.mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}), destroy: jest.fn() }));
  const result = await s3.upload(Buffer.from('image'), 'image/webp');
  const connection = S3Client.mock.results[0].value; const command = connection.send.mock.calls[0][0].input;
  expect(command.Bucket).toBe('private-comics'); expect(command.ACL).toBeUndefined();
  expect(command.Key).toBe('panels/' + result.fileId); expect(result.url).toBe('/api/media/' + result.fileId);
});
test('storage credentials cannot be sent over HTTP in production', async () => {
  process.env.S3_ENDPOINT = 'http://storage.example.invalid';
  await expect(s3.upload(Buffer.from('image'), 'image/png')).rejects.toThrow('HTTPS');
  expect(S3Client).not.toHaveBeenCalled();
});
test('successive image requests reuse one S3 connection', async () => {
  S3Client.mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}), destroy: jest.fn() }));
  await s3.upload(Buffer.from('one'), 'image/png'); await s3.upload(Buffer.from('two'), 'image/png');
  expect(S3Client).toHaveBeenCalledTimes(1);
});
test('reads and deletion reject arbitrary object paths', async () => {
  await expect(s3.read('../secret')).rejects.toThrow('Invalid object identifier');
  expect(() => s3.remove('../secret')).toThrow('Invalid object identifier');
});
test('oversized object responses are rejected before buffering the image', async () => {
  const body = { destroy: jest.fn() };
  S3Client.mockImplementation(() => ({ send: jest.fn().mockResolvedValue({ ContentLength: 11 * 1024 * 1024, Body: body }), destroy: jest.fn() }));
  await expect(s3.read(id)).rejects.toThrow('image limit'); expect(body.destroy).toHaveBeenCalled();
});
