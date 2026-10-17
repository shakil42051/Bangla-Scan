const { imageType, validateBatch, MAX_BATCH } = require('../src/utils/uploadValidation');
const { progressPipeline } = require('../src/utils/progress');
test('rejects files with a forged image MIME type', () => {
  expect(() => imageType(Buffer.from('<script>bad()</script>'))).toThrow('not a supported');
});
test('identifies image signatures rather than trusting file extensions', () => {
  expect(imageType(Buffer.from([255, 216, 255, 224]))).toBe('image/jpeg');
  expect(imageType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
});
test('rejects aggregate upload batches over the allowed limit', () => {
  const file = { buffer: Buffer.alloc(1024 * 1024) };
  expect(() => validateBatch(Array.from({ length: MAX_BATCH / file.buffer.length + 1 }, () => file))).toThrow('Batch exceeds');
});
test('progress update uses typed IDs and a single atomic document update', () => {
  const entry = { seriesId: '507f1f77bcf86cd799439011', chapterId: '507f1f77bcf86cd799439012', page: 5, completion: 50 };
  const pipeline = progressPipeline(entry);
  const [filter, appended] = pipeline[0].$set.readingProgress.$concatArrays;
  const target = filter.$filter.cond.$ne[1];
  const original = [{ seriesId: target, page: 1 }, { seriesId: target, page: 3 }, { seriesId: 'another-series', page: 7 }];
  const result = [...original.filter(item => String(item.seriesId) !== String(target)), ...appended];
  expect(result.filter(item => String(item.seriesId) === entry.seriesId)).toHaveLength(1);
  expect(result.find(item => String(item.seriesId) === entry.seriesId).page).toBe(5);
  expect(result.find(item => item.seriesId === 'another-series').page).toBe(7);
});
