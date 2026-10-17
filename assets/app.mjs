import { renderAuth } from './auth-ui.mjs';
import { renderSettings } from './settings-ui.mjs';
import { normalizePreferences } from './preferences.mjs';
import { moreGroups } from './navigation.mjs';
import { api, auth, storage, logout, restoreSession, clearSession } from './api.mjs';
import { renderHome, renderExplore, renderUpdates, renderRankings, renderGenres, renderCommunity } from './discovery.mjs';
import { renderCollection, renderHistory, renderNotifications, renderProfile, renderHelp, chooseBookmark, renderSavedPages } from './account.mjs';
import { renderSeries } from './series.mjs';
import { renderReader } from './reader.mjs';
import { icon, hydrateIcons, escapeHTML as e, idOf, safeURL, cover, empty, toast, formError, openDialog } from './ui.mjs';

const main = document.querySelector('#main');
let navigation;
let cleanup;

let settings = {};
const hadPreferences = Boolean(storage.get('preferences'));
let preferences = normalizePreferences(storage.get('preferences', {}));
const browseNav = [['home', 'Home', 'home'], ['updates', 'Latest updates', 'fire'], ['explore', 'Series directory', 'compass'], ['rankings', 'Rankings', 'chart'], ['genres', 'Genres', 'grid'], ['community', 'Community', 'message']];
const personalNav = [['saved-pages', 'Saved pages', 'bookmark'], ['library', 'Followed series', 'panels'], ['wishlist', 'Read later', 'heart'], ['history', 'Reading history', 'history'], ['notifications', 'Notifications', 'bell']];
const link = (route, label, glyph, current) => `<a class="nav-link ${current === route ? 'active' : ''}" href="#/${route}" ${current === route ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${current === route ? '<span class="nav-dot"></span>' : ''}</a>`;
function applyTheme(theme) {
  preferences.theme = ['dark', 'light', 'system'].includes(theme) ? theme : 'dark';
  const resolved = preferences.theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : preferences.theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.palette = preferences.accentPalette === 'site' ? settings.accentPalette || 'indigo' : preferences.accentPalette;
  document.documentElement.dataset.textSize = preferences.textSize;
  document.documentElement.dataset.contrast = preferences.highContrast ? 'high' : 'normal';
  document.documentElement.dataset.dataSaver = preferences.dataSaver ? 'on' : 'off';
  document.documentElement.classList.toggle('reduce-motion', preferences.reduceMotion);
  document.documentElement.classList.toggle('compact', Boolean(preferences.compact));
  document.querySelector('meta[name="theme-color"]').content = resolved === 'light' ? '#f4f5fb' : '#0b0d14';
  document.querySelector('[data-action="theme"]').setAttribute('aria-label', `Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`);
  storage.set('preferences', preferences);
}
function shell(current) {
  if (!auth.user || auth.isAdmin) { const badge = document.querySelector('#notification-count'); badge.textContent = ''; badge.hidden = true; }
  document.querySelector('#desktop-nav').innerHTML = '<span class="nav-label">DISCOVER</span>' + browseNav.map(x => link(...x, current)).join('') + '<span class="nav-label">FOLLOWING</span>' + personalNav.map(x => link(...x, current)).join('') + (auth.isAdmin ? '<span class="nav-label">PUBLISHING</span>' + link('admin', 'Content studio', 'grid', current) : '');
  document.querySelector('#mobile-nav').innerHTML = [['home', 'Home', 'home'], ['updates', 'Updates', 'fire'], ['explore', 'Browse', 'compass'], ['library', 'Follows', 'panels']].map(x => link(...x, current)).join('') + `<button class="nav-link" data-action="more">${icon('menu')}<span>More</span></button>`;
  document.querySelector('#settings-link').innerHTML = icon('settings') + '<span>Settings & help</span>';
  const name = auth.user?.name || auth.user?.username || 'Content team';
  document.querySelector('#account-action').innerHTML = auth.user ? `<a class="avatar" href="#/${auth.isAdmin ? 'admin' : 'profile'}" aria-label="Your account">${e(name[0].toUpperCase())}</a>` : '<a href="#/login" class="button button-small">Sign in</a>';
  document.querySelector('#account-summary').innerHTML = auth.user ? `<a class="account-summary" href="#/${auth.isAdmin ? 'admin' : 'profile'}"><span class="avatar">${e(name[0])}</span><span><strong>${e(name)}</strong><small>${auth.isAdmin ? 'Content team' : 'Reader profile'}</small></span>${icon('chevron')}</a>` : '<a class="account-summary" href="#/register"><span class="avatar">' + icon('user') + '</span><span><strong>Join the community</strong><small>Save, follow & discuss</small></span></a>';
}
function moreMenu() {
  const dialog = openDialog('More from Bangla Scan', '<div class="more-groups">' + moreGroups.map(group => ({ ...group, links: group.links.filter(([key]) => !preferences.moreLinks || !['saved-pages','wishlist','history','notifications','rankings','genres','community'].includes(key) || preferences.moreLinks.includes(key)) })).filter(group => group.links.length).map(group => '<section><h3>' + group.title + '</h3><nav class="more-menu">' + group.links.map(item => link(...item, '')).join('') + '</nav></section>').join('') + '</div>');
  dialog.querySelectorAll('a').forEach(a => a.onclick = () => dialog.close());
}
const retry = () => '<button class="button" data-action="retry">Try again</button>';
function errorView(error, title = 'We couldn’t load this page') { return empty(title, error.status === 401 ? 'Sign in to continue.' : error.message || 'Check your connection, then try again.', error.status === 401 ? '<a class="button" href="#/login">Sign in</a>' : error.status === 403 ? '<a class="button" href="#/settings">Manage your account</a>' : retry()); }
const progressKey = () => auth.user && !auth.isAdmin ? `progress:${idOf(auth.user)}` : 'progress:guest';
const history = () => storage.get(progressKey(), {});
function progressFor(id) {
  const local = history()[id];
  const remote = auth.user?.readingProgress?.filter(p => String(p.seriesId) === id).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  return local && (!remote || new Date(local.updatedAt) > new Date(remote.updatedAt)) ? local : remote;
}

async function savePreferences(values) {
  const normalized = normalizePreferences(values);
  if (auth.user && !auth.isAdmin) { const result = await api('/users/profile', { method: 'PUT', body: { preferences: normalized } }); auth.user.preferences = result.data.preferences; }
  preferences = normalized; applyTheme(preferences.theme);
}
function authenticated() { if (auth.user?.preferences) preferences = normalizePreferences({ ...preferences, ...auth.user.preferences }); applyTheme(preferences.theme); }

async function route() {
  navigation?.abort(); cleanup?.(); cleanup = null;
  navigation = new AbortController(); const signal = navigation.signal;
  document.title = 'Bangla Scan — Manga, Manhwa, Manhua & Comics';
  const raw = location.hash.replace(/^#\/?/, '') || 'home';
  const [pathname, search = ''] = raw.split('?'); const [page, id, chapter] = pathname.split('/'); const params = new URLSearchParams(search);
  if (page === 'home' && settings.seo?.defaultMetaTitle) document.title = settings.seo.defaultMetaTitle;
  shell(page); main.setAttribute('aria-busy', 'true'); window.scrollTo(0, 0);
  try {
    if (settings.maintenanceMode && !auth.isAdmin && !['login', 'register', 'settings', 'forgot-password', 'forgot-username', 'reset-password', 'verify-email', 'security'].includes(page)) { main.innerHTML = empty('A short intermission', settings.maintenanceMessage || 'We’re preparing your next chapter. Please check back soon.'); return; }
    if (page === 'home') await renderHome(main, { history, settings }, signal);
    else if (page === 'explore') await renderExplore(main, params, signal);
    else if (page === 'series' && id) await renderSeries(main, encodeURIComponent(id), progressFor(id), settings, signal);
    else if (page === 'read' && id && chapter !== undefined) cleanup = await renderReader(main, encodeURIComponent(id), encodeURIComponent(chapter), settings, preferences, signal);
    else if (page === 'library') await renderCollection(main, params, signal);
    else if (['login', 'register', 'forgot-password', 'forgot-username', 'reset-password'].includes(page)) renderAuth(main, page, params, settings, authenticated);
    else if (page === 'verify-email') { const result = await api('/auth/verify-email', { method: 'POST', body: { token: params.get('token') } }); if (auth.user) auth.user.isEmailVerified = true; main.innerHTML = empty('You’re all set', result.message, '<a class="button" href="#/home">Back to stories</a>'); }
    else if (page === 'updates') await renderUpdates(main, params, signal);
    else if (page === 'rankings' || page === 'trending') await renderRankings(main, params, signal);
    else if (page === 'genres') await renderGenres(main, signal);
    else if (page === 'community') await renderCommunity(main, params, signal);
    else if (page === 'wishlist') await renderCollection(main, params, signal, true);
    else if (page === 'saved-pages') renderSavedPages(main);
    else if (page === 'history') await renderHistory(main, params, signal);
    else if (page === 'notifications') await renderNotifications(main, params, signal);
    else if (page === 'profile') renderProfile(main);
    else if (page === 'help') renderHelp(main, settings);
    else if (['settings', 'security', 'device-data'].includes(page)) { if (page !== 'settings') params.set('panel', page === 'security' ? 'security' : 'data'); await renderSettings(main, params, preferences, savePreferences, signal); }
    else if (page === 'admin') { const { renderAdmin } = await import('./admin.mjs'); await renderAdmin(main, id || 'dashboard', params, signal); }
    else main.innerHTML = empty('This chapter doesn’t exist', 'The page may have moved. There are more stories to discover.', '<a class="button" href="#/home">Back to home</a>');
  } catch (error) { if (!signal.aborted) main.innerHTML = errorView(error); }
  finally { if (!signal.aborted) { main.setAttribute('aria-busy', 'false'); main.focus({ preventScroll: true }); } }
}

document.addEventListener('submit', async event => {
  const form = event.target; if (!(form instanceof HTMLFormElement)) return;
  if (form.id === 'search-form' || form.id === 'catalog-filters') {
    event.preventDefault(); const query = new URLSearchParams(); for (const [key, value] of new FormData(form)) if (value) query.set(key, value); location.hash = '/explore?' + query; if (form.id === 'search-form') form.querySelector('input').blur(); return;
  }
  if (form.id !== 'rating-form') return;
  event.preventDefault(); const submit = form.querySelector('[type=submit]'); submit.disabled = true;
  try { const values = Object.fromEntries(new FormData(form)); await api('/ratings', { method: 'POST', body: { ...values, score: Number(values.score), seriesId: form.dataset.series } }); toast('Your rating is saved.'); }
  catch (error) { formError(form, error); } finally { submit.disabled = false; }
});
document.addEventListener('click', async event => {
  if (event.target.closest('.skip-link')) { event.preventDefault(); main.focus(); return; }
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const action = button.dataset.action;
  try {
    if (action === 'theme') { applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); if (auth.user && !auth.isAdmin) { await api('/users/profile', { method: 'PUT', body: { preferences } }); auth.user.preferences = { ...preferences }; } }
    else if (action === 'retry') route();
    else if (action === 'logout') { const revoked = await logout(); toast(revoked ? 'Signed out. See you next chapter.' : 'Signed out on this device. Server session revocation could not be confirmed.'); if (location.hash === '#/home') route(); else location.hash = '/home'; }
    else if (action === 'revoke-sessions') { await api('/auth/revoke-sessions', { method: 'POST' }); clearSession(); toast('All sessions have been signed out.'); if (location.hash === '#/login') route(); else location.hash = '/login'; }
    else if (action === 'verify-email') { button.disabled = true; const result = await api('/auth/send-verification', { method: 'POST' }); toast(result.message); }
    else if (action === 'bookmark') await chooseBookmark(button.dataset.series);
    else if (action === 'more') moreMenu();
    else if (action === 'random') { button.disabled = true; const result = await api('/series/random'); document.querySelector('dialog[open]')?.close(); if (!result.data) { toast('No published series available yet.'); return; } location.hash = '/series/' + idOf(result.data); }
    else if (action === 'remove-bookmark') { await api('/bookmarks/' + button.dataset.series, { method: 'DELETE' }); toast('Removed from your library.'); route(); }
    else if (action === 'share') { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); toast('Story link copied.'); } }
  } catch (error) { if (error.name !== 'AbortError') toast(error.message || 'Something went wrong. Please try again.'); }
  finally { button.disabled = false; }
});
document.addEventListener('error', event => {
  const img = event.target;
  if (img instanceof HTMLImageElement && !img.closest('.comic-pages')) { const wrapper = document.createElement('div'); wrapper.innerHTML = cover({ title: img.alt.replace(/ cover$/, '') }); img.replaceWith(wrapper.firstElementChild); }
}, true);
document.addEventListener('change', async event => {
  const input = event.target;
  if (input.matches('[data-show-password]')) input.form.querySelector('[name="password"]').type = input.checked ? 'text' : 'password';

});
document.addEventListener('keydown', event => { if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); document.querySelector('#search-form input').focus(); } });
function networkStatus() { const banner = document.querySelector('#connection-banner'); banner.hidden = navigator.onLine; banner.textContent = 'You’re offline. Your reading position stays on this device; reconnect to load chapters and sync.'; }
window.addEventListener('online', networkStatus); window.addEventListener('offline', networkStatus);
window.addEventListener('hashchange', () => { document.querySelector('dialog[open]')?.close(); route(); });
window.addEventListener('bs:refresh', () => { if (!document.body.classList.contains('is-reading')) route(); });
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (preferences.theme === 'system') applyTheme('system'); });
window.addEventListener('bs:settings', event => { settings = { ...settings, ...event.detail }; applySiteSettings(); });
window.addEventListener('bs:notifications', event => { const badge = document.querySelector('#notification-count'); badge.textContent = event.detail || ''; badge.hidden = !event.detail; });
function applySiteSettings() {
  document.documentElement.dataset.palette = preferences.accentPalette === 'site' ? settings.accentPalette || 'indigo' : preferences.accentPalette;
  if (settings.seo?.defaultMetaDescription || settings.siteDescription) document.querySelector('meta[name=description]').content = settings.seo?.defaultMetaDescription || settings.siteDescription;
  let verification = document.querySelector('meta[name="google-site-verification"]');
  if (settings.seo?.googleSiteVerification) { if (!verification) { verification = document.createElement('meta'); verification.name = 'google-site-verification'; document.head.append(verification); } verification.content = settings.seo.googleSiteVerification; }
  document.querySelector('#footer-tagline').textContent = settings.footerTagline || 'Manga. Manhwa. Manhua. Comics.';
  const announcement = document.querySelector('#site-announcement'); announcement.textContent = settings.broadcastMessage || ''; announcement.hidden = !settings.broadcastMessage;
  document.querySelector('.footer-social')?.remove(); const links = Object.entries(settings.social || {}).filter(([, url]) => safeURL(url));
  const footer = document.createElement('nav'); footer.className = 'footer-social'; footer.setAttribute('aria-label', 'Community and support');
  footer.innerHTML = '<a href="#/help">Reader guide</a>' + links.map(([name, url]) => `<a href="${e(safeURL(url))}" target="_blank" rel="noopener noreferrer">${e(name)}</a>`).join(''); document.querySelector('.site-footer').append(footer);
}
async function start() {
  applyTheme(preferences.theme); hydrateIcons(); networkStatus();
  // Remove legacy plaintext account caches from previous versions, never clear unrelated site storage.
  try { for (const key of ['Bangla Scan_users', 'Bangla Scan_session', 'banglascan_admin_token', 'banglascan_user_token']) localStorage.removeItem(key); } catch { /* Storage can be blocked. */ }
  await Promise.allSettled([restoreSession(), api('/settings').then(result => { settings = result.data; })]);
  applySiteSettings();
  if (!hadPreferences) { preferences.theme = settings.defaultTheme || 'dark'; preferences.readerLayout = settings.defaultReaderLayout || 'vertical'; preferences.readerWidth = settings.defaultReaderWidth || 'fit'; preferences.readerTone = settings.defaultReaderTone || 'dark'; preferences.imageGap = Boolean(settings.defaultImageGap); }
  if (safeURL(settings.logoUrl)) document.querySelectorAll('.brand-mark').forEach(mark => { const image = document.createElement('img'); image.src = safeURL(settings.logoUrl); image.alt = settings.siteName || 'Bangla Scan'; image.className = 'brand-logo'; mark.replaceWith(image); });
  if (safeURL(settings.faviconUrl)) document.querySelector('link[rel=icon]').href = safeURL(settings.faviconUrl);
  if (auth.user?.preferences) { preferences = normalizePreferences({ ...preferences, ...auth.user.preferences }); applyTheme(preferences.theme); }
  applyTheme(preferences.theme);
  if (auth.user && !auth.isAdmin) api('/notifications?limit=1').then(result => window.dispatchEvent(new CustomEvent('bs:notifications', { detail: result.unreadCount || 0 }))).catch(() => {});
  await route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}
start();
