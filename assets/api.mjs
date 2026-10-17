const memory = new Map();
const API_BASE = (typeof document !== 'undefined' && document.querySelector('meta[name="api-base"]')?.content || '/api').replace(/\/+$/, '');
export const storage = {
  get(key, fallback = null) { try { return JSON.parse(localStorage.getItem('bs:' + key)) ?? fallback; } catch { return memory.get(key) ?? fallback; } },
  set(key, value) { memory.set(key, value); try { localStorage.setItem('bs:' + key, JSON.stringify(value)); } catch { /* Session-only settings when storage is restricted. */ } },
  remove(key) { memory.delete(key); try { localStorage.removeItem('bs:' + key); } catch { /* Restricted device storage. */ } },
};
const session = {
  get() { try { return JSON.parse(sessionStorage.getItem('bs:session')); } catch { return null; } },
  set(value) { try { if (value) sessionStorage.setItem('bs:session', JSON.stringify(value)); else sessionStorage.removeItem('bs:session'); } catch { /* Memory session still works. */ } },
};
// Migrate legacy refresh sessions once, then keep only access tokens in memory.
let legacy = session.get();
session.set(null);
let tokens = null;
let refreshing;
export const auth = { user: null, isAdmin: false };
export class APIError extends Error { constructor(message, status) { super(message); this.status = status; } }
async function raw(path, options = {}) {
  const { body, headers, binary, ...rest } = options;
  let response;
  try {
    response = await fetch(API_BASE + path, {
      ...rest, credentials: 'include', signal: options.signal || AbortSignal.timeout(20000),
      headers: { ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(tokens?.accessToken ? { Authorization: 'Bearer ' + tokens.accessToken } : {}), ...headers },
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new APIError('Cannot reach Bangla Scan. Check your connection, then try again.', 0);
    }
    if (error.name === 'TimeoutError') throw new APIError('The server took too long to respond. Please try again.', 0);
    throw error;
  }
  if (response.ok && binary) return response.blob();
  const data = await response.json().catch(() => ({ message: 'The server returned an unexpected response.' }));
  if (!response.ok) throw new APIError(data.message || 'Request failed.', response.status);
  return data;
}
export async function api(path, options = {}) {
  try { return await raw(path, options); }
  catch (error) {
    if (error.status === 401 && tokens?.accessToken && !['/auth/login', '/auth/register', '/auth/admin/login', '/auth/refresh', '/auth/forgot-password', '/auth/forgot-username', '/auth/reset-password', '/auth/verify-email'].includes(path)) {
      refreshing ||= raw('/auth/refresh', { method: 'POST' }).then(result => { tokens = { accessToken: result.data.accessToken }; }).catch(error => { clearSession(); throw error; }).finally(() => { refreshing = null; });
      await refreshing;
      return raw(path, options);
    }
    throw error;
  }
}
export async function login(values, admin = false, register = false) {
  const result = await raw(register ? '/auth/register' : admin ? '/auth/admin/login' : '/auth/login', { method: 'POST', body: values });
  if (result.data.requiresTwoFactor) return result.data;
  tokens = { accessToken: result.data.accessToken };
  auth.user = result.data.user || result.data.admin;
  auth.isAdmin = Boolean(result.data.admin);
  return result.data;
}
export function clearSession() { tokens = null; legacy = null; session.set(null); auth.user = null; auth.isAdmin = false; }
export async function restoreSession() {
  try {
    // Refresh before /me so expired access tokens can restore without a local profile cache.
    const result = await raw('/auth/refresh', { method: 'POST', ...(legacy?.refreshToken ? { body: { refreshToken: legacy.refreshToken } } : {}) });
    tokens = { accessToken: result.data.accessToken }; legacy = null;
    const me = await raw('/auth/me'); auth.user = me.data;
    auth.isAdmin = ['super_admin', 'admin', 'editor', 'moderator'].includes(me.data.role) && !me.data.username;
  } catch (error) { if ([400, 401, 403].includes(error.status)) clearSession(); else throw error; }
}
export async function logout() { try { if (tokens) await api('/auth/logout', { method: 'POST' }); return true; } catch { return false; } finally { clearSession(); } }
export async function allPages(path, signal) {
  const data = []; let page = 1;
  for (;;) {
    const result = await api(`${path}${path.includes('?') ? '&' : '?'}limit=100&page=${page}`, { signal });
    data.push(...result.data);
    if (page >= (result.pagination?.pages || 1)) return data;
    page++;
  }
}
