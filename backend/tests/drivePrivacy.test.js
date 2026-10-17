jest.mock('googleapis', () => ({ google: { auth: { GoogleAuth: jest.fn() }, drive: jest.fn() } }));
const { google } = require('googleapis');
const Account = require('../src/models/DriveAccount');
const manager = require('../src/services/driveManager');
const id = '507f1f77bcf86cd799439011';
let drive;
beforeEach(() => {
  manager.evictClient(id);
  const account = { _id: id, name: 'Test Drive', isActive: true, authType: 'service_account', rootFolderId: 'private-folder-1234' };
  jest.spyOn(manager, 'pickBestDrive').mockResolvedValue(account);
  jest.spyOn(Account, 'findById').mockReturnValue({ select: async () => account });
  jest.spyOn(Account, 'findByIdAndUpdate').mockResolvedValue({});
  drive = { permissions: { list: jest.fn(), create: jest.fn() }, files: { create: jest.fn().mockResolvedValue({ data: { id: 'private-image-id', size: '3' } }) } };
  google.drive.mockReturnValue(drive);
});
afterEach(() => jest.restoreAllMocks());
test('uploads are refused when the destination folder would expose drafts publicly', async () => {
  drive.permissions.list.mockResolvedValue({ data: { permissions: [{ type: 'anyone' }] } });
  await expect(manager.upload(Buffer.from('abc'), 'page.jpg', 'image/jpeg')).rejects.toThrow('private Drive folder');
  expect(drive.files.create).not.toHaveBeenCalled(); expect(drive.permissions.create).not.toHaveBeenCalled();
});
test('private uploads keep private permissions and use the protected media route', async () => {
  drive.permissions.list.mockResolvedValue({ data: { permissions: [{ type: 'user' }] } });
  const result = await manager.upload(Buffer.from('abc'), 'page.jpg', 'image/jpeg');
  expect(result.url).toBe('/api/media/private-image-id'); expect(drive.permissions.create).not.toHaveBeenCalled();
});
