import test from 'node:test';
import assert from 'node:assert/strict';

const map = new Map();
globalThis.sessionStorage = { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
globalThis.localStorage = globalThis.sessionStorage;
const { api, login, auth, allPages, clearSession, restoreSession } = await import('../assets/api.mjs');
const response = (status, data) => ({ ok: status < 400, status, json: async () => data });
test('login preserves passwords exactly and restores from /auth/me', async () => {
  let submitted;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/login')) { submitted = JSON.parse(options.body); return response(200, { data: { accessToken: 'a', refreshToken: 'r', user: { _id: 'u', username: 'reader' } } }); }
    if (url.endsWith('/auth/refresh')) return response(200, { data: { accessToken: 'b', refreshToken: 's' } });
    assert.equal(url, '/api/auth/me'); return response(200, { data: { _id: 'u', username: 'reader' } });
  };
  await login({ email: 'reader@example.com', password: ' secret ' });
  assert.equal(submitted.password, ' secret ');
  assert.equal(map.has('bs:session'), false);
  await restoreSession(); assert.equal(auth.user.username, 'reader');
});
test('authenticator challenges issue no client session and refresh uses HTTP-only cookies', async () => {
  clearSession();
  globalThis.fetch = async (url, options) => { assert.equal(options.credentials, 'include'); return response(202, { data: { requiresTwoFactor: true } }); };
  assert.equal((await login({ identifier: 'reader', password: 'secret' })).requiresTwoFactor, true);
  assert.equal(auth.user, null); assert.equal(map.has('bs:session'), false);
});
test('concurrent expired requests share one refresh and retry once', async () => {
  globalThis.fetch = async () => response(200, { data: { accessToken: 'expired', user: { _id: 'u', username: 'reader' } } });
  await login({ identifier: 'reader', password: 'test-only' });
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 10)); return response(200, { data: { accessToken: 'new', refreshToken: 'r2' } }); }
    return options.headers.Authorization === 'Bearer new' ? response(200, { success: true }) : response(401, { message: 'expired' });
  };
  await Promise.all([api('/bookmarks'), api('/users/profile')]); assert.equal(refreshes, 1);
});
test('background save failures are surfaced and are not false successes', async () => {
  globalThis.fetch = async () => response(500, { message: 'Save failed' });
  await assert.rejects(api('/users/reading-progress', { method: 'POST', body: {} }), /Save failed/);
});
test('pagination follows all pages despite server caps', async () => {
  clearSession();
  globalThis.fetch = async url => { const page = Number(new URL(url, 'https://example.com').searchParams.get('page')); return response(200, { data: [page], pagination: { pages: 3 } }); };
  assert.deepEqual(await allPages('/series?sort=title'), [1, 2, 3]);
});

test('comic archive downloads preserve binary data and surface disabled-download errors', async () => {
  const archive = new Blob(['PK-comic-archive'], { type: 'application/vnd.comicbook+zip' });
  globalThis.fetch = async () => ({ ok: true, status: 200, blob: async () => archive });
  assert.equal(await api('/chapters/c/download', { binary: true }), archive);
  globalThis.fetch = async () => response(403, { message: 'Downloads disabled' });
  await assert.rejects(api('/chapters/c/download', { binary: true }), /Downloads disabled/);
});
