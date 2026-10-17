jest.mock('../src/config/db', () => jest.fn().mockResolvedValue());
jest.mock('../src/utils/crons', () => jest.fn());
const { EventEmitter } = require('events');
const app = require('../src/server');
afterEach(() => jest.restoreAllMocks());
test('a busy port rejects startup and stops jobs without announcing a working server', async () => {
  const stop = jest.fn(); require('../src/utils/crons').mockReturnValue([{ stop }]);
  const disconnect = jest.spyOn(require('mongoose'), 'disconnect').mockResolvedValue();
  jest.spyOn(app, 'listen').mockImplementation(() => { const server = new EventEmitter(); queueMicrotask(() => server.emit('error', Object.assign(new Error('Port busy'), { code: 'EADDRINUSE' }))); return server; });
  const original = { bootstrap: process.env.BOOTSTRAP_LOCAL_ADMIN, driver: process.env.STORAGE_DRIVER };
  process.env.BOOTSTRAP_LOCAL_ADMIN = 'false'; process.env.STORAGE_DRIVER = 'local';
  process.env.JWT_SECRET = 'test-access-secret-32-characters-long'; process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
  try { await expect(app.start()).rejects.toHaveProperty('code', 'EADDRINUSE'); expect(stop).toHaveBeenCalled(); expect(disconnect).toHaveBeenCalled(); }
  finally { for (const [key, value] of [['BOOTSTRAP_LOCAL_ADMIN', original.bootstrap], ['STORAGE_DRIVER', original.driver]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
