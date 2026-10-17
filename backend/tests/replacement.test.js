jest.mock('../src/services/driveService', () => ({ uploadToDrive: jest.fn(), deleteFromDrive: jest.fn() }));
const drive = require('../src/services/driveService');
const Upload = require('../src/models/Upload');
const Series = require('../src/models/Series');
const Chapter = require('../src/models/Chapter');
const { replaceFile } = require('../src/services/uploadService');
const params = { oldFileId: 'old', oldDriveAccountId: '507f1f77bcf86cd799439011', newBuffer: Buffer.from([255, 216, 255]), originalName: 'new.jpg', uploadedBy: '507f1f77bcf86cd799439012' };
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });
beforeEach(() => { jest.spyOn(require('../src/models/Settings'), 'findById').mockReturnValue({ select: () => ({ lean: async () => ({}) }) }); });
test('disabled image formats are rejected before uploading bytes', async () => {
  require('../src/models/Settings').findById.mockReturnValue({ select: () => ({ lean: async () => ({ allowedImageTypes: ['image/png'] }) }) });
  await expect(require('../src/services/uploadService').uploadFile({ buffer: Buffer.from([255, 216, 255]), originalName: 'image.jpg', type: 'cover' })).rejects.toThrow('disabled');
  expect(drive.uploadToDrive).not.toHaveBeenCalled();
});
test('failed replacement upload never deletes the existing file', async () => {
  jest.spyOn(Upload, 'findOne').mockResolvedValue({ _id: 'old-record', type: 'cover' });
  drive.uploadToDrive.mockRejectedValue(new Error('Storage unavailable'));
  await expect(replaceFile(params)).rejects.toThrow('Storage unavailable');
  expect(drive.deleteFromDrive).not.toHaveBeenCalled();
});
test('replacement switches all page and cover references before retiring old file', async () => {
  jest.spyOn(Upload, 'findOne').mockResolvedValue({ _id: 'old-record', type: 'chapter_page' });
  drive.uploadToDrive.mockResolvedValue({ fileId: 'new', driveId: params.oldDriveAccountId, url: 'https://example.com/new.jpg' });
  jest.spyOn(Upload, 'create').mockResolvedValue({ fileId: 'new', driveAccountId: params.oldDriveAccountId, url: 'https://example.com/new.jpg' });
  for (const name of ['HomepageSection', 'UpcomingSeries', 'Settings']) jest.spyOn(require('../src/models/' + name), 'updateMany').mockResolvedValue({});
  const series = jest.spyOn(Series, 'updateMany').mockResolvedValue({});
  const chapter = jest.spyOn(Chapter, 'updateMany').mockResolvedValue({});
  jest.spyOn(Upload, 'findByIdAndUpdate').mockResolvedValue({});
  drive.deleteFromDrive.mockResolvedValue();
  await replaceFile(params);
  expect(series).toHaveBeenCalledTimes(2);
  expect(chapter.mock.calls[0][1].$set['pages.$[page].url']).toBe('https://example.com/new.jpg');
  expect(chapter.mock.invocationCallOrder[0]).toBeLessThan(drive.deleteFromDrive.mock.invocationCallOrder[0]);
});
