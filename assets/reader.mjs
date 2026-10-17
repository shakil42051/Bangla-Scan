import { api, auth, storage, allPages } from './api.mjs';
import { icon, escapeHTML as e, idOf, safeURL, skeleton, empty, openDialog, toast } from './ui.mjs';
import { readingKey, chooseBookmark, saveFile, reportIssue } from './account.mjs';
const writes = new Map();
export async function renderReader(root, id, number, settings, preferences, signal) {
  root.innerHTML = skeleton();
  const [detail, result, chapters] = await Promise.all([api('/series/' + id, { signal }), api(`/chapters/series/${id}/${number}`, { signal }), allPages('/chapters/series/' + id + '?sort=chapterNumber', signal)]);
  if (signal.aborted) return;
  const series = detail.data.series; const { chapter, prev, next } = result.data;
  const pages = [...chapter.pages].sort((a, b) => a.order - b.order); const total = pages.length;
  const key = readingKey('progress'); const activityKey = readingKey('activity'); const bookmarkKey = readingKey('pageBookmarks');
  const syncUser = auth.user && !auth.isAdmin ? idOf(auth.user) : null;
  const local = storage.get(key, {})[id]; const remote = auth.user?.readingProgress?.find(p => String(p.seriesId) === id);
  const stored = local && (!remote || new Date(local.updatedAt || 0) >= new Date(remote.updatedAt || 0)) ? local : remote;
  let page = Number(stored?.chapterNumber) === Number(number) ? Math.max(1, Math.min(total, Number(stored.page) || 1)) : 1;
  const requestedPage = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('page'));
  if (Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= total) page = requestedPage;
  const opts = { layout: preferences.readerLayout || settings.defaultReaderLayout || 'vertical', direction: preferences.readingDirection || chapter.readingDirection || series.defaultReadingDirection || 'vertical', width: preferences.readerWidth || 'fit', tone: preferences.readerTone || 'dark', gap: Boolean(preferences.imageGap) };
  let settingsTimer;
  let timer, dirty = false, saving = Promise.resolve(), observer, disposed = false;
  const viewed = new Set();
  document.body.classList.add('is-reading');
  const chapterLink = ch => `#/read/${id}/${ch.chapterNumber}`;
  const select = (key, label, options) => `<label>${label}<select data-reader-option="${key}">${options.map(([v, text]) => `<option value="${v}" ${opts[key] === v ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
  root.innerHTML = `<div class="reader-toolbar"><a class="back-link" href="#/series/${id}">${icon('back')}<span>${e(series.title)}</span></a><label class="reader-chapter-select"><span class="sr-only">Choose chapter</span><select data-reader-chapter>${chapters.map(ch => `<option value="${ch.chapterNumber}" ${ch.chapterNumber === chapter.chapterNumber ? 'selected' : ''}>Ch. ${ch.chapterNumber} · ${e(ch.title || '')}</option>`).join('')}</select></label><div class="reader-tools"><button class="icon-button" data-reader-action="toc" aria-label="Chapter list" title="Chapter list">${icon('menu')}</button><button class="icon-button" data-reader-action="settings" aria-label="Reader settings" title="Reader settings">${icon('settings')}</button><button class="icon-button" data-reader-action="fullscreen" aria-label="Toggle fullscreen" title="Fullscreen (F)">${icon('expand')}</button><button class="icon-button" data-reader-action="hide" aria-label="Hide reader controls" title="Hide controls (H)">${icon('close')}</button></div></div><button class="reader-reveal button" data-reader-action="hide">${icon('menu')} Show controls</button><div class="reader-heading"><span class="eyebrow">${e(series.type || 'COMIC')} · CHAPTER ${chapter.chapterNumber}</span><h1>${e(chapter.title || 'Chapter ' + number)}</h1><p id="save-status" role="status">${syncUser ? 'Progress syncs to your account' : 'Progress saves on this device'}</p><div class="reader-secondary"><button class="text-button" data-reader-action="report">${icon('message')} Report a problem</button><button class="text-button" data-reader-action="bookmark">${icon('bookmark')} Bookmark page</button><button class="text-button" data-reader-action="collection">${icon('plus')} Follow series</button>${settings.downloadsEnabled ? `<button class="text-button" data-reader-action="download">${icon('download')} Download CBZ</button>` : ''}</div></div><section class="comic-pages" tabindex="0" aria-label="Comic pages">${pages.map((image, i) => `<figure id="comic-page-${i + 1}" data-page="${i + 1}"><img src="${e(safeURL(image.url))}" alt="${e(series.title)}, chapter ${number}, page ${i + 1}" width="${Number(image.width) || 800}" height="${Number(image.height) || 1200}" loading="${(!preferences.dataSaver && i < 2) || i + 1 === page ? 'eager' : 'lazy'}" decoding="async"><button class="image-retry" data-reader-action="retry-image" hidden>Image failed · Retry page ${i + 1}</button><figcaption>Page ${i + 1}</figcaption></figure>`).join('') || empty('No pages published yet', 'Return to the chapter list for other chapters.')}</section><div class="reader-finish"><h2>Chapter ${chapter.chapterNumber} complete?</h2><p>${e(chapter.notes || 'Like this chapter? Save the series and join the discussion.')}</p><div><button class="button button-secondary" data-reader-action="complete" ${!total ? 'disabled' : ''}>${icon('check')} Mark chapter complete</button><a class="button button-secondary" href="#/series/${id}?comments=1">${icon('message')} Discuss this series</a></div></div><nav class="reader-navigation" aria-label="Reader navigation"><div class="chapter-nav">${prev ? `<a class="button button-secondary" aria-label="Previous chapter" href="${chapterLink(prev)}">${icon('back')}<span>Previous chapter</span></a>` : '<button class="button button-secondary" disabled>First chapter</button>'}</div><div class="page-nav"><button class="icon-button" data-reader-action="prev-page" aria-label="Previous page">${icon('back')}</button><label class="page-jump"><span class="sr-only">Go to page</span><input type="number" data-reader-page min="1" max="${total || 1}" value="${page}" aria-label="Page number"><span>/ ${total}</span></label><button class="icon-button" data-reader-action="next-page" aria-label="Next page">${icon('chevron')}</button></div><div class="chapter-nav">${next ? `<a class="button" aria-label="Next chapter" href="${chapterLink(next)}"><span>Next chapter</span>${icon('arrow')}</a>` : '<a class="button button-secondary" href="#/series/' + id + '">Chapter list</a>'}</div></nav>`;
  document.title = `${series.title} · Chapter ${number} — Bangla Scan`;
  const container = root.querySelector('.comic-pages');
  const figures = [...container.querySelectorAll('figure')];
  const status = root.querySelector('#save-status');
  const save = () => {
    clearTimeout(timer); if (!dirty || !total) return saving; dirty = false;
    const entry = { seriesId: id, chapterId: idOf(chapter), chapterNumber: chapter.chapterNumber, title: series.title, coverImage: series.coverImage, page, completion: Math.round(page / total * 100), updatedAt: new Date().toISOString() };
    const records = storage.get(key, {}); records[id] = entry; storage.set(key, records);
    if (preferences.recordHistory !== false) {
    const log = storage.get(activityKey, []); const event = log.find(item => item.chapterId === entry.chapterId);
    if (event) Object.assign(event, entry, { pages: [...new Set([...(event.pages || []), ...viewed])], completed: event.completed || page === total });
    else log.unshift({ ...entry, pages: [...viewed], completed: page === total });
    storage.set(activityKey, log.slice(0, 200));
    }
    if (syncUser && idOf(auth.user) === syncUser) {
      status.textContent = 'Saving your place…';
      const writeKey = `${syncUser}:${id}`;
      saving = (writes.get(writeKey) || Promise.resolve()).catch(() => {}).then(() => { if (idOf(auth.user) !== syncUser) return; return api('/users/reading-progress', { method: 'POST', body: { ...entry, pagesViewed: [...viewed] }, keepalive: true }); }).then(() => { if (status.isConnected) status.textContent = 'Your place is saved'; }).catch(() => { if (status.isConnected) { status.textContent = 'Saved on this device · Sync failed. '; const retry = document.createElement('button'); retry.className = 'text-button'; retry.textContent = 'Retry'; retry.onclick = () => { dirty = true; save(); }; status.append(retry); } });
      writes.set(writeKey, saving);
    }
    return saving;
  };
  const record = value => { page = Math.max(1, Math.min(total || 1, value)); viewed.add(page); dirty = true; root.querySelector('[data-reader-page]').value = page; root.querySelector('[data-reader-action="prev-page"]').disabled = page <= 1; root.querySelector('[data-reader-action="next-page"]').disabled = page >= total && !(next && preferences.autoNextChapter); clearTimeout(timer); timer = setTimeout(save, 700); };
  const display = () => {
    container.className = `comic-pages layout-${opts.layout} width-${opts.width} ${opts.gap ? 'with-gap' : ''}`; container.dir = opts.direction === 'rtl' ? 'rtl' : 'ltr'; document.body.dataset.readerTone = opts.tone;
    for (const figure of figures) figure.hidden = opts.layout !== 'vertical' && !(Number(figure.dataset.page) === page || (opts.layout === 'double' && Number(figure.dataset.page) === page + 1));
    if (opts.layout === 'double' && page < total) viewed.add(page + 1);
  };
  const goto = value => {
    if (value > total && next && preferences.autoNextChapter) { location.hash = chapterLink(next); return; }
    record(value); display(); if (opts.layout === 'vertical') figures[page - 1]?.scrollIntoView({ block: 'start', behavior: 'instant' }); else container.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const readerSettings = () => {
    const dialog = openDialog('Comic reader settings', `<div class="form-grid reader-options">${select('layout', 'Page layout', [['vertical', 'Webtoon · vertical scroll'], ['single', 'Single page'], ['double', 'Double page spread']])}${select('direction', 'Reading direction', [['vertical', 'Top to bottom'], ['ltr', 'Left to right'], ['rtl', 'Right to left · manga']])}${select('width', 'Page width', [['fit', 'Fit screen'], ['narrow', 'Narrow · 720 px'], ['wide', 'Wide · 1200 px'], ['original', 'Original image width']])}${select('tone', 'Reader background', [['dark', 'Midnight'], ['black', 'Pure black'], ['light', 'Paper white'], ['sepia', 'Warm sepia']])}<label class="checkbox-label"><input type="checkbox" data-reader-gap ${opts.gap ? 'checked' : ''}>Space between pages</label></div><p class="muted">Shortcuts: ← → pages · N / P chapters · F fullscreen · H controls · B bookmark · Esc close.</p><button class="button" data-close-reader-options>Done</button>`);
    dialog.querySelector('[data-close-reader-options]').onclick = () => dialog.close();
    dialog.addEventListener('change', event => {
      const input = event.target;
      if (input.dataset.readerOption) opts[input.dataset.readerOption] = input.value;
      if (input.hasAttribute('data-reader-gap')) opts.gap = input.checked;
      Object.assign(preferences, { readerLayout: opts.layout, readingDirection: opts.direction, readerWidth: opts.width, readerTone: opts.tone, imageGap: opts.gap }); storage.set('preferences', preferences); display();
      if (syncUser) { clearTimeout(settingsTimer); settingsTimer = setTimeout(() => { if (idOf(auth.user) !== syncUser) return; return api('/users/profile', { method: 'PUT', body: { preferences } }).then(result => { if (auth.user && idOf(auth.user) === syncUser) auth.user.preferences = result.data.preferences; }).catch(() => toast('Reader preferences saved on this device. Account sync failed.')); }, 500); }
    });
  };
  const onClick = async event => {
    const button = event.target.closest('[data-reader-action]'); if (!button || button.disabled) return;
    const action = button.dataset.readerAction;
    try {
      if (action === 'settings') readerSettings();
      else if (action === 'hide') document.body.classList.toggle('reader-controls-hidden');
      else if (action === 'fullscreen') { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
      else if (action === 'next-page' || action === 'prev-page') goto(page + (action === 'next-page' ? 1 : -1) * (opts.layout === 'double' ? 2 : 1));
      else if (action === 'report') reportIssue(id, chapter.chapterNumber, page);
      else if (action === 'collection') await chooseBookmark(id, detail.data.userBookmark || {});
      else if (action === 'bookmark') { const bookmarks = storage.get(bookmarkKey, []); if (!bookmarks.some(b => b.chapterId === idOf(chapter) && b.page === page)) { bookmarks.unshift({ seriesId: id, chapterId: idOf(chapter), chapterNumber: chapter.chapterNumber, page, title: series.title, updatedAt: new Date().toISOString() }); storage.set(bookmarkKey, bookmarks.slice(0, 500)); } toast(`Page ${page} bookmarked on this device. Find it in More → Saved pages.`); }
      else if (action === 'download') { button.disabled = true; toast('Preparing chapter archive…'); const blob = await api('/chapters/' + idOf(chapter) + '/download', { binary: true, signal: AbortSignal.timeout(120000) }); saveFile(blob, `${series.title}-chapter-${number}.cbz`); }
      else if (action === 'complete') { record(total); await save(); toast('Chapter marked complete.'); }
      else if (action === 'retry-image') { const image = button.previousElementSibling; image.src = image.src; }
      else if (action === 'toc') {
        const bookmarks = storage.get(bookmarkKey, []).filter(b => b.seriesId === id);
        const dialog = openDialog('Chapter list & page bookmarks', `<label>Find chapter<input type="search" data-toc-search placeholder="Chapter number or title"></label><div class="toc-list">${chapters.map(ch => `<a data-toc-title="${e((ch.chapterNumber + ' ' + ch.title).toLowerCase())}" href="${chapterLink(ch)}" class="chapter-row ${ch.chapterNumber === chapter.chapterNumber ? 'current' : ''}"><strong>Chapter ${ch.chapterNumber}</strong><span>${e(ch.title)}</span></a>`).join('')}</div>${bookmarks.length ? `<h3>Saved pages · this device</h3><div class="saved-pages">${bookmarks.map((b, i) => `<div><button class="text-button" data-saved-page="${i}">Chapter ${b.chapterNumber} · Page ${b.page}</button><button class="icon-button" data-remove-page="${i}" aria-label="Remove page bookmark">${icon('close')}</button></div>`).join('')}</div>` : ''}`);
        dialog.querySelector('[data-toc-search]').oninput = event => dialog.querySelectorAll('[data-toc-title]').forEach(row => { row.hidden = !row.dataset.tocTitle.includes(event.target.value.toLowerCase()); });
        dialog.querySelectorAll('.toc-list a').forEach(a => a.onclick = () => dialog.close());
        dialog.querySelectorAll('[data-saved-page]').forEach(b => b.onclick = () => { const mark = bookmarks[Number(b.dataset.savedPage)]; dialog.close(); if (mark.chapterNumber === chapter.chapterNumber) goto(mark.page); else { const records = storage.get(key, {}); records[id] = mark; storage.set(key, records); location.hash = chapterLink(mark); } });
        dialog.querySelectorAll('[data-remove-page]').forEach(b => b.onclick = () => { const mark = bookmarks[Number(b.dataset.removePage)]; storage.set(bookmarkKey, storage.get(bookmarkKey, []).filter(x => !(x.chapterId === mark.chapterId && x.page === mark.page))); b.parentElement.remove(); });
      }
    } catch (error) { toast(error.message || 'This action could not be completed.'); } finally { button.disabled = false; }
  };
  root.querySelector('[data-reader-page]').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); goto(Number(event.target.value) || 1); } };
  const onChange = event => { if (event.target.matches('[data-reader-chapter]')) location.hash = `#/read/${id}/${event.target.value}`; if (event.target.matches('[data-reader-page]')) goto(Number(event.target.value) || 1); };
  const onKey = event => {
    if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'f', 'h', 'b', 'n', 'p'].includes(key)) event.preventDefault();
    if (key === 'arrowleft' || key === 'arrowright') goto(page + (key === 'arrowright' ? 1 : -1) * (opts.direction === 'rtl' ? -1 : 1) * (opts.layout === 'double' ? 2 : 1));
    if (key === 'n' && next) location.hash = chapterLink(next); if (key === 'p' && prev) location.hash = chapterLink(prev);
    const action = { f: 'fullscreen', h: 'hide', b: 'bookmark' }[key]; if (action) root.querySelector(`[data-reader-action="${action}"]`).click();
  };
  const onHidden = () => { if (document.hidden) save(); }; const onOnline = () => { dirty = true; save(); };
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); document.addEventListener('keydown', onKey); document.addEventListener('visibilitychange', onHidden); window.addEventListener('online', onOnline);
  container.querySelectorAll('img').forEach(img => { img.onerror = () => { img.nextElementSibling.hidden = false; img.classList.add('failed'); }; img.onload = () => { img.nextElementSibling.hidden = true; img.classList.remove('failed'); }; });
  observer = new IntersectionObserver(entries => {
    if (disposed || opts.layout !== 'vertical') return;
    const visible = entries.filter(x => x.isIntersecting).sort((a, b) => Math.abs(a.boundingClientRect.top - 100) - Math.abs(b.boundingClientRect.top - 100))[0];
    if (visible) record(Number(visible.target.dataset.page));
  }, { rootMargin: '-80px 0px -35% 0px', threshold: [0, 0.2, 0.5] });
  record(page); display(); figures.forEach(f => observer.observe(f)); if (page > 1 && opts.layout === 'vertical') figures[page - 1]?.scrollIntoView({ block: 'start', behavior: 'instant' });
  return () => { disposed = true; observer.disconnect(); save(); root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onHidden); window.removeEventListener('online', onOnline); document.body.classList.remove('is-reading', 'reader-controls-hidden'); delete document.body.dataset.readerTone; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
}
