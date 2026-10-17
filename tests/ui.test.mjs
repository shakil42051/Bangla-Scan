import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { escapeHTML, safeURL, rating, card, localDay } from '../assets/ui.mjs';
globalThis.location = { origin: 'https://banglascan.example' };

test('renders ten-point ratings safely, including invalid extremes', () => {
  for (const score of [0, 5, 8, 10, 100, -5, NaN]) {
    const html = card({ _id: 'abc', title: 'A story', rating: score });
    assert.match(html, /out of 10/);
    assert.ok(!html.includes('NaN'));
  }
  assert.equal(rating(8.7), 8.7); assert.equal(rating(100), 10);
});
test('escapes database content and blocks executable image URLs', () => {
  const html = card({ _id: 'abc', title: '"><img src=x onerror=alert(1)>', coverImage: { url: 'javascript:alert(1)' }, author: '<script>bad()</script>' });
  assert.ok(!html.includes('<img src=x')); assert.ok(!html.includes('<script>'));
  assert.equal(safeURL('javascript:alert(1)'), '');
  assert.equal(safeURL('data:image/svg+xml,<svg/>'), '');
  assert.equal(safeURL('/cover.jpg'), 'https://banglascan.example/cover.jpg');
  assert.equal(escapeHTML("<&\"'>"), '&lt;&amp;&quot;&#39;&gt;');
});
test('Bangladesh day boundary uses the chosen timezone', () => {
  assert.equal(localDay(new Date('2026-10-14T20:00:00Z')), '2026-10-15');
  assert.equal(localDay(new Date('2026-10-14T20:00:00Z'), 'UTC'), '2026-10-14');
});
test('website has no duplicated IDs, inline handlers or CDN execution', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.doesNotMatch(html, /on(?:click|submit|error)=/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
  assert.match(html, /Skip to content/);
});
test('private API and chapter media are excluded from offline cache', async () => {
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(worker, /url.pathname.startsWith\('\/api\/'\)/);
  assert.match(worker, /request.headers.has\('Authorization'\)/);
  assert.match(worker, /if \(!SHELL.includes/);
});
