const CACHE = 'banglascan-shell-v7';
const SHELL = ['/', '/assets/styles.css', '/assets/app.mjs', '/assets/api.mjs', '/assets/ui.mjs', '/assets/admin.mjs', '/assets/admin-extras.mjs', '/assets/media-admin.mjs', '/assets/storage-admin.mjs', '/assets/navigation.mjs', '/assets/preferences.mjs', '/assets/auth-ui.mjs', '/assets/settings-ui.mjs', '/assets/discovery.mjs', '/assets/account.mjs', '/assets/series.mjs', '/assets/reader.mjs', '/assets/manga-hero.webp', '/assets/cover-shadow.webp', '/assets/cover-lotus.webp', '/assets/cover-neon.webp', '/manifest.json', '/bangla_scan_logo.svg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('banglascan') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || request.headers.has('Authorization')) return;
  if (!SHELL.includes(url.pathname)) return;
  event.respondWith(fetch(request, { cache: 'no-cache' }).then(response => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy))); }
    return response;
  }).catch(async () => await caches.match(request) || (request.mode === 'navigate' ? await caches.match('/') : null) || new Response('Offline. Reconnect and try again.', { status: 503 })));
});
