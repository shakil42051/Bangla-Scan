import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const backend = new URL(process.env.API_TARGET || 'http://127.0.0.1:5000');
const types = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/') || ['/health', '/ready'].includes(url.pathname)) {
    const proxy = http.request(new URL(req.url, backend), { method: req.method, headers: { ...req.headers, host: backend.host } }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res); });
    proxy.setTimeout(20000, () => proxy.destroy());
    proxy.on('error', () => { if (!res.headersSent) { res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ success: false, message: 'The reading service is temporarily unavailable. Please try again shortly.' })); } });
    req.pipe(proxy); return;
  }
  const relative = url.pathname === '/' || url.pathname === '/index.html' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !(relative === 'index.html' || ['manifest.json', 'sw.js', 'bangla_scan_logo.svg'].includes(relative) || relative.startsWith('assets/')) || relative.includes('..')) { res.writeHead(404); res.end('Not found'); return; }
  try { const data = await readFile(file); res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }); res.end(data); }
  catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.WEB_PORT) || 3000, '127.0.0.1', () => console.log(`Bangla Scan: http://localhost:${server.address().port}`));
