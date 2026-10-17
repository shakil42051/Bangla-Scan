import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreferences, validateBackup } from '../assets/preferences.mjs';
test('imported preferences accept only known, typed values', () => {
  const value = normalizePreferences(JSON.parse('{"theme":"javascript:bad","textSize":"large","recordHistory":false,"highContrast":"yes","moreLinks":["admin","history","history"],"password":"secret","__proto__":{"isAdmin":true}}'));
  assert.equal(value.theme, 'dark'); assert.equal(value.textSize, 'large'); assert.equal(value.highContrast, false); assert.equal(value.recordHistory, false);
  assert.deepEqual(value.moreLinks, ['history']); assert.ok(!('password' in value)); assert.equal({}.isAdmin, undefined);
});
test('bookmark backup validation rejects arbitrary IDs, malformed pages and oversized collections', () => {
  const item = { seriesId: '507f1f77bcf86cd799439011', chapterId: '507f1f77bcf86cd799439012', chapterNumber: 1.5, page: 2, title: '<img src=x>' };
  const input = { version: 1, preferences: { accentPalette: 'cyan' }, bookmarks: [item] };
  assert.equal(validateBackup(input).preferences.accentPalette, 'cyan');
  for (const changed of [{ seriesId: '../admin' }, { page: 999 }, { chapterNumber: Infinity }, { page: -1 }]) assert.throws(() => validateBackup({ ...input, bookmarks: [{ ...item, ...changed }] }));
  assert.throws(() => validateBackup({ ...input, bookmarks: Array.from({ length: 501 }, () => item) }));
});
