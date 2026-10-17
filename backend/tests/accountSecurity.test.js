const security = require('../src/services/accountSecurity');
const User = require('../src/models/User');
afterEach(() => jest.restoreAllMocks());
test('refresh cookies cannot be confused with different body credentials', () => {
  expect(security.refreshFrom({ headers: { cookie: 'x=y; bs_refresh=cookie-token' }, body: {} })).toBe('cookie-token');
  expect(() => security.refreshFrom({ headers: { cookie: 'bs_refresh=cookie-token' }, body: { refreshToken: 'other-token' } })).toThrow('Conflicting');
});
test('public account serialization excludes all MFA, reset and session secrets', () => {
  const value = security.publicJSON({ name: 'Reader', twoFactorEnabled: true, passwordHash: 'secret', refreshTokenHash: 'secret', sessionVersion: 5, mfaSecret: 'secret', mfaPendingSecret: 'secret', mfaBackupHashes: ['secret'], mfaLastStep: 4, passwordResetToken: 'secret', emailVerificationToken: 'secret' });
  expect(value).toEqual({ name: 'Reader', twoFactorEnabled: true });
});
test('production refresh cookies are secure, HTTP-only and scoped', () => {
  const old = process.env.NODE_ENV; process.env.NODE_ENV = 'production'; const res = { cookie: jest.fn() };
  try { security.setRefresh(res, 'test-only'); expect(res.cookie.mock.calls[0][2]).toMatchObject({ secure: true, httpOnly: true, sameSite: 'strict', path: '/api/auth' }); } finally { process.env.NODE_ENV = old; }
});
test('backup codes are consumed atomically and cannot be reused', async () => {
  const code = security.codes().values[0]; const write = jest.spyOn(User, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 }).mockResolvedValueOnce({ modifiedCount: 0 });
  const entity = { _id: '507f1f77bcf86cd799439011', twoFactorEnabled: true, sessionVersion: 1 };
  expect(await security.factor(entity, 'user', code)).toBe(true); expect(await security.factor(entity, 'user', code)).toBe(false);
  expect(write.mock.calls[0][0].mfaBackupHashes).toBe(security.hash(code)); expect(JSON.stringify(write.mock.calls[0])).not.toContain(code);
});
test('new-password policy rejects common passwords, repetition, short values and non-string input', () => {
  const valid = require('../src/utils/passwordPolicy');
  for (const bad of ['password12345', 'a'.repeat(30), 'tiny', {}, '123456789012']) expect(valid(bad)).toBe(false);
  expect(valid('river moon lantern quiet')).toBe(true);
});
test('reader preferences reject unknown keys and invalid shortcut routes', () => {
  const valid = require('../src/services/readerPreferences');
  expect(valid({ recordHistory: false, moreLinks: ['history'], accentPalette: 'cyan' })).toBe(true);
  for (const input of [{ moreLinks: ['admin'] }, { recordHistory: 'false' }, { constructor: {} }, { arbitrary: true }]) expect(valid(input)).toBe(false);
});
