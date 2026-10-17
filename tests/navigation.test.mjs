import test from 'node:test';
import assert from 'node:assert/strict';
import { moreGroups } from '../assets/navigation.mjs';
test('More contains overflow destinations once and excludes the primary tabs and avatar links', () => {
  const routes = moreGroups.flatMap(group => group.links.map(link => link[0]));
  assert.equal(routes.length, new Set(routes).size);
  for (const primary of ['home', 'updates', 'explore', 'library', 'profile', 'admin']) assert.ok(!routes.includes(primary));
  for (const important of ['saved-pages', 'notifications', 'history', 'settings', 'help']) assert.ok(routes.includes(important));
});
