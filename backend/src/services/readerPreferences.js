'use strict';
const choices = { theme: ['dark', 'light', 'system'], accentPalette: ['site', 'indigo', 'cyan', 'emerald', 'rose'], textSize: ['small', 'normal', 'large'], readingDirection: ['ltr', 'rtl', 'vertical'], readerLayout: ['vertical', 'single', 'double'], readerWidth: ['fit', 'narrow', 'wide', 'original'], readerTone: ['dark', 'black', 'light', 'sepia'], language: ['bn', 'en'] };
const booleans = ['autoNextChapter', 'showAdultContent', 'fitWidth', 'imageGap', 'compact', 'newChapterAlerts', 'highContrast', 'reduceMotion', 'dataSaver', 'recordHistory'];
const menu = ['saved-pages', 'wishlist', 'history', 'notifications', 'rankings', 'genres', 'community'];
module.exports = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 25) return false;
  return Object.entries(value).every(([key, item]) => {
    if (Object.hasOwn(choices, key)) return choices[key].includes(item);
    if (booleans.includes(key)) return typeof item === 'boolean';
    if (key === 'moreLinks') return Array.isArray(item) && item.length <= 7 && item.every(route => menu.includes(route));
    if (key === 'timezone' && typeof item === 'string') { try { new Intl.DateTimeFormat('en', { timeZone: item }); return true; } catch { return false; } }
    return false;
  });
};
