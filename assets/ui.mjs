export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const idOf = value => String(value?._id || value?.id || '');
export const safeURL = value => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { const url = new URL(value, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
export const rating = value => Math.min(10, Math.max(0, Number(value) || 0));
export const localDay = (date = new Date(), timezone = 'Asia/Dhaka') => new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const e = escapeHTML;
const paths = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  share: '<path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/>',
  fire: '<path d="M12 2c2 5-3 6-1 10 2-1 3-3 3-5 4 4 6 7 4 11-3 5-12 4-13-2-1-4 3-7 7-14Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  history: '<path d="M3 4v5h5M3.5 9a9 9 0 1 1-.1 6M12 7v5l3 2"/>',
  chart: '<path d="M4 20h17M7 16v-5m5 5V5m5 11V8"/>',
  message: '<path d="M3 3h18v14H8l-5 4Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M3 17v4h18v-4"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  note: '<path d="M4 3h16v14l-4 4H4Z M8 8h8M8 12h8M8 16h4"/>',
  shuffle: '<path d="m17 3 4 4-4 4M3 17l6-6m6-4h6M3 7h4l10 10h4m-4-4 4 4-4 4"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  panels: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 11h18M12 3v8m-3 0v10"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
export const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.panels}</svg>`;
export function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
export function cover(series, className = '', eager = false) {
  const src = typeof document !== 'undefined' && document.documentElement.dataset.dataSaver === 'on' ? '' : safeURL(series.coverImage?.url || series.coverImage || '');
  return src ? `<img class="${className}" src="${escapeHTML(src)}" alt="${escapeHTML(series.title)} cover" loading="${eager ? 'eager' : 'lazy'}" width="400" height="600">` : `<div class="cover-placeholder ${className}" aria-label="Cover unavailable"><span lang="bn">বাংলা স্ক্যান</span><strong>${escapeHTML(series.title)}</strong><span>BANGLA SCAN</span></div>`;
}
export const formatLabel = value => ({ manga: 'Manga', manhwa: 'Manhwa', manhua: 'Manhua', comic: 'Comic', webtoon: 'Webtoon' })[value] || 'Comic';
export const dateLabel = value => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value)) : 'Recently';
export function card(series) {
  const score = rating(series.rating); const id = encodeURIComponent(idOf(series));
  return `<article class="series-card"><a class="cover-link" href="#/series/${id}">${cover(series)}<span class="type-badge type-${e(series.type || 'comic')}">${formatLabel(series.type)}</span><span class="cover-read">${icon('panels')} View chapters</span>${series.status === 'completed' ? '<span class="complete-badge">Completed</span>' : ''}</a><div class="card-meta"><span>${e(series.genres?.[0]?.name || series.status || 'Comic')}</span><span class="score">${icon('star')} ${score ? score.toFixed(1) : '—'}<span class="sr-only"> out of 10</span></span></div><h3><a href="#/series/${id}">${e(series.title)}</a></h3><p class="card-subtitle">${Number(series.chapterCount) || 0} chapters <span>·</span> ${e(series.status || 'ongoing')}</p></article>`;
}
export const cards = items => `<div class="series-grid">${items.map(card).join('')}</div>`;
export const skeleton = () => `<div class="series-grid" aria-label="Loading stories" role="status">${Array.from({ length: 6 }, () => '<div class="skeleton-card"><div></div><span></span><span></span></div>').join('')}</div>`;
export const empty = (title, text, action = '') => `<div class="empty-state">${icon('panels')}<h2>${escapeHTML(title)}</h2><p>${escapeHTML(text)}</p>${action}</div>`;
let toastTimer;
export function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 5000); }
export function openDialog(title, html) {
  const dialog = document.querySelector('#app-dialog');
  const previous = document.activeElement;
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${escapeHTML(title)}</h2><button class="icon-button" data-close-dialog aria-label="Close dialog">${icon('close')}</button></div>${html}`;
  dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => previous?.isConnected && previous.focus(), { once: true });
  dialog.showModal();
  return dialog;
}
export function formError(form, error) { const el = form.querySelector('[data-form-error]'); if (el) { el.textContent = error.message || String(error); el.hidden = false; el.focus(); } else toast(error.message || String(error)); }
