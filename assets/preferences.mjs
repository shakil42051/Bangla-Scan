export const defaults = { theme: 'dark', accentPalette: 'site', textSize: 'normal', highContrast: false, reduceMotion: false, dataSaver: false, recordHistory: true, readerLayout: 'vertical', readingDirection: 'vertical', readerWidth: 'fit', readerTone: 'dark', imageGap: false, autoNextChapter: true, newChapterAlerts: true, compact: false, showAdultContent: false };
export const menuOptions = [['saved-pages', 'Saved pages', 'bookmark'], ['wishlist', 'Read later', 'heart'], ['history', 'Reading history', 'history'], ['notifications', 'Notifications', 'bell'], ['rankings', 'Rankings', 'chart'], ['genres', 'Genres', 'grid'], ['community', 'Community', 'message']];
const choices = { theme: ['dark', 'light', 'system'], accentPalette: ['site', 'indigo', 'cyan', 'emerald', 'rose'], textSize: ['small', 'normal', 'large'], readerLayout: ['vertical', 'single', 'double'], readingDirection: ['vertical', 'ltr', 'rtl'], readerWidth: ['fit', 'narrow', 'wide', 'original'], readerTone: ['dark', 'black', 'light', 'sepia'] };
export function normalizePreferences(input = {}) {
  const result = { ...defaults };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  for (const [key, fallback] of Object.entries(defaults)) {
    if (choices[key]?.includes(input[key]) || (typeof fallback === 'boolean' && typeof input[key] === 'boolean')) result[key] = input[key];
  }
  if (Array.isArray(input.moreLinks)) result.moreLinks = [...new Set(input.moreLinks.filter(value => menuOptions.some(([route]) => value === route)))].slice(0, 7);
  if (typeof input.timezone === 'string') { try { new Intl.DateTimeFormat('en', { timeZone: input.timezone }); result.timezone = input.timezone; } catch { /* Ignore invalid imported timezones. */ } }
  return result;
}
export function validateBackup(data) {
  if (!data || data.version !== 1 || !data.preferences || !Array.isArray(data.bookmarks) || data.bookmarks.length > 500) throw new Error('Choose a valid Bangla Scan device backup with up to 500 bookmarks.');
  const bookmarks = data.bookmarks.map(item => {
    if (!item || !/^[a-f0-9]{24}$/i.test(item.seriesId) || !/^[a-f0-9]{24}$/i.test(item.chapterId) || !Number.isFinite(item.chapterNumber) || item.chapterNumber < 0 || !Number.isInteger(item.page) || item.page < 1 || item.page > 200 || typeof item.title !== 'string' || item.title.length > 300) throw new Error('The backup contains an invalid page bookmark.');
    return { seriesId: item.seriesId, chapterId: item.chapterId, chapterNumber: item.chapterNumber, page: item.page, title: item.title };
  });
  return { preferences: normalizePreferences(data.preferences), bookmarks };
}
