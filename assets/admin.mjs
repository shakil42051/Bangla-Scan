import { renderStorageSummary } from './storage-admin.mjs';
import { renderMedia } from './media-admin.mjs';
import { extraAdmin, editPages } from './admin-extras.mjs';
import { saveFile } from './account.mjs';
import { api, auth, allPages } from './api.mjs';
import { escapeHTML as e, idOf, icon, empty, openDialog, formError, toast } from './ui.mjs';

const allowed = permission => auth.isAdmin && (auth.user.role === 'super_admin' || auth.user.permissions?.[permission]);
const sections = [['dashboard', 'Dashboard', 'dashboard'], ['appearance', 'Appearance', 'manageSettings'], ['reader', 'Reader defaults', 'manageSettings'], ['uploads', 'Upload policy', 'manageSettings'], ['reports', 'Chapter reports', 'manageChapters'], ['audit', 'Activity log', 'manageSettings'], ['community', 'Community', 'manageUsers'], ['seo', 'SEO & links', 'manageSettings'], ['advanced', 'Backup & system', 'manageSettings'], ['series', 'Series', 'manageSeries'], ['chapters', 'Chapters', 'manageChapters'], ['media', 'Media manager', 'manageSettings'], ['genres', 'Genres', 'manageSeries'], ['homepage', 'Homepage', 'manageHomepage'], ['upcoming', 'Upcoming', 'manageHomepage'], ['drives', 'Storage', 'manageSettings'], ['users', 'Readers', 'manageUsers'], ['admins', 'Team', 'super'], ['analytics', 'Analytics', 'viewAnalytics'], ['settings', 'Site settings', 'manageSettings']];
let context;
const fields = {
  upcoming: [['title', 'Title', 'text', true], ['description', 'Description', 'textarea'], ['type', 'Format', ['manga', 'manhwa', 'manhua', 'comic', 'webtoon']], ['expectedDate', 'Expected release', 'datetime-local'], ['order', 'Display order', 'number'], ['isActive', 'Visible', 'checkbox']],
  series: [['title', 'Title', 'text', true], ['author', 'Author'], ['artist', 'Artist'], ['type', 'Format', ['manga', 'manhwa', 'manhua', 'comic', 'webtoon']], ['status', 'Status', ['ongoing', 'completed', 'hiatus', 'cancelled', 'upcoming']], ['visibility', 'Visibility', ['draft', 'public', 'private', 'scheduled']], ['publishAt', 'Publish at', 'datetime-local'], ['language', 'Content language', ['bn', 'en']], ['defaultReadingDirection', 'Default reading direction', ['vertical', 'ltr', 'rtl']], ['description', 'Description', 'textarea'], ['tags', 'Tags (comma separated)'], ['releaseYear', 'Release year', 'number'], ['featuredOrder', 'Featured order (0 = not featured)', 'number'], ['isAdultContent', 'Adult content', 'checkbox']],
  chapters: [['chapterNumber', 'Chapter number', 'number', true], ['title', 'Chapter title'], ['visibility', 'Visibility', ['draft', 'public', 'private', 'scheduled']], ['publishAt', 'Publish at', 'datetime-local'], ['readingDirection', 'Reading direction', ['vertical', 'ltr', 'rtl']], ['notes', 'Translator notes', 'textarea']],
  genres: [['name', 'Name', 'text', true], ['description', 'Description', 'textarea'], ['order', 'Display order', 'number'], ['isActive', 'Visible', 'checkbox']],
  homepage: [['title', 'Section title', 'text', true], ['type', 'Section type', ['latest', 'popular', 'trending', 'featured', 'genre', 'custom', 'upcoming', 'banner']], ['genreId', 'Genre ID (genre sections)'], ['seriesIds', 'Series IDs, comma separated (custom sections)'], ['limit', 'Series limit', 'number'], ['order', 'Display order', 'number'], ['isActive', 'Visible', 'checkbox'], ['badge', 'Section badge'], ['displayStyle', 'Display style', ['grid', 'list', 'hero', 'banner']], ['bannerTitle', 'Banner heading'], ['bannerSubtitle', 'Banner subtitle'], ['bannerLink', 'Banner destination URL', 'url']],
  users: [['isActive', 'Account active', 'checkbox'], ['role', 'Reader role', ['user', 'moderator']]],
  admins: [['name', 'Name', 'text', true], ['email', 'Email', 'email', true], ['password', 'Initial password (new team members only)', 'password'], ['role', 'Role', ['editor', 'moderator', 'admin', 'super_admin']], ['isActive', 'Account active', 'checkbox']],
  drives: [['email', 'Account email', 'email', true], ['label', 'Label'], ['rootFolderId', 'Root folder ID'], ['credentials', 'Google Drive credentials JSON', 'textarea', true]],
};
const permissionKeys = ['manageSeries', 'manageChapters', 'manageUsers', 'manageAdmins', 'manageSettings', 'viewAnalytics', 'manageHomepage', 'deleteContent'];
function field([name, label, type = 'text', required], item) {
  let value = item[name] ?? (name === 'isActive' ? true : name === 'defaultReadingDirection' ? (item.type === 'comic' ? 'ltr' : !item.type || item.type === 'manga' ? 'rtl' : 'vertical') : '');
  if (Array.isArray(value)) value = value.map(v => typeof v === 'object' ? idOf(v) : v).join(', ');
  if (name === 'genreId' && typeof value === 'object') value = idOf(value);
  if (type === 'datetime-local' && value) value = new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  if (type === 'checkbox') return `<label class="checkbox-label"><input type="checkbox" name="${name}" ${value ? 'checked' : ''}>${label}</label>`;
  if (Array.isArray(type)) return `<label>${label}<select name="${name}">${type.map(v => `<option value="${v}" ${v === value ? 'selected' : ''}>${({ bn: 'বাংলা', en: 'English', vertical: 'Vertical scroll', ltr: 'Left to right', rtl: 'Right to left' })[v] || v}</option>`).join('')}</select></label>`;
  return `<label class="${type === 'textarea' ? 'wide' : ''}">${label}${type === 'textarea' ? `<textarea name="${name}" maxlength="5000" ${required ? 'required' : ''}>${e(value)}</textarea>` : `<input name="${name}" type="${type}" value="${e(value)}" ${type === 'number' ? 'min="0" step="any"' : ''} ${name === 'password' ? 'minlength="8" autocomplete="new-password"' : ''} ${required ? 'required' : ''}>`}</label>`;
}
const action = (name, id, label, kind = '') => `<button class="button ${['new', 'upload'].includes(name) ? '' : 'button-secondary'} ${kind}" data-admin-action="${name}" data-id="${e(id)}">${label}</button>`;
function table(headers, rows) { return `<div class="table-wrapper"><table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`; }
function row(item, tab) {
  const id = idOf(item);
  const title = item.title || item.name || item.username || item.email || `Chapter ${item.chapterNumber}`;
  const status = item.visibility || item.health?.status || item.role || (item.isActive === false ? 'Inactive' : 'Active');
  return `<tr><td><span class="table-title">${tab === 'series' ? `<label class="checkbox-label"><input type="checkbox" data-bulk-series="${id}" aria-label="Select ${e(title)}">${e(title)}</label>` : e(title)}<small>${e(item.email || item.type || '')}</small></span></td><td>${e(status)}</td><td>${tab === 'series' ? `${Number(item.chapterCount) || 0} chapters` : tab === 'chapters' ? `${Number(item.pageCount) || 0} pages` : tab === 'drives' ? `${(Number(item.usedBytes || 0) / 1024 ** 3).toFixed(2)} GB used` : e(item.order ?? '')}</td><td>${tab === 'series' ? `<a class="button button-secondary" href="#/admin/chapters?seriesId=${id}">Chapters</a>` + action('media', id, 'Cover') : ''}${tab === 'chapters' ? action('upload', id, 'Upload pages') + action('pages', id, 'Page order') : ''}${action('edit', id, 'Edit')}${tab === 'drives' ? action('reconnect', id, 'Reconnect') : ''}${allowed('deleteContent') || ['homepage', 'upcoming', 'genres', 'drives', 'admins'].includes(tab) ? action('delete', id, 'Delete', 'danger-button') : ''}</td></tr>`;
}
export async function renderAdmin(root, tab, params, signal) {
  if (!auth.isAdmin) { root.innerHTML = empty('Content studio', 'Sign in with a content team account to continue.', '<a class="button" href="#/login">Team sign in</a>'); return; }
  const visible = sections.filter(([, , perm]) => perm === 'dashboard' ? true : perm === 'super' ? auth.user.role === 'super_admin' : allowed(perm));
  if (!visible.some(([key]) => key === tab)) tab = visible[0]?.[0];
  if (!tab) { root.innerHTML = empty('No tools assigned', 'Ask your site administrator to assign permissions to your account.'); return; }
  context = { root, tab, params, signal, items: [], endpoint: '', seriesId: params.get('seriesId') };
  root.innerHTML = `<div class="page-intro"><span class="eyebrow">BEHIND THE STORIES</span><h1>Content studio.</h1><p>Publish with care. Keep your readers coming back.</p></div><label class="admin-mobile-picker">Content studio section<select data-admin-section>${visible.map(([key, label]) => `<option value="${key}" ${key === tab ? 'selected' : ''}>${label}</option>`).join('')}</select></label><nav class="admin-nav" aria-label="Content studio">${visible.map(([key, label]) => `<a href="#/admin/${key}" class="${tab === key ? 'active' : ''}" ${tab === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav><div id="admin-content">Loading ${e(tab)}…</div>`;
  root.querySelector('[data-admin-section]').onchange = event => { location.hash = '/admin/' + event.target.value; };
  const content = root.querySelector('#admin-content');
  if (tab === 'media') return renderMedia(content, params, signal);
  if (await extraAdmin(content, tab, params, signal, field)) return;
  if (tab === 'settings') {
    const result = await api('/settings', { signal }); const s = result.data;
    content.innerHTML = `<section class="panel"><h2>Site settings</h2><form id="site-settings-form" class="form-grid">${[['siteName', 'Site name'], ['siteDescription', 'Site description'], ['broadcastMessage', 'Reader announcement', 'textarea'], ['maintenanceMessage', 'Maintenance message'], ['maintenanceMode', 'Maintenance mode', 'checkbox'], ['allowRegistration', 'Allow new accounts', 'checkbox'], ['allowGuestReading', 'Allow guest reading', 'checkbox'], ['requireEmailVerification', 'Require verified email for reading (configure SMTP first)', 'checkbox'], ['adultContentEnabled', 'Allow adult content', 'checkbox']].map(f => field(f, s)).join('')}<p data-form-error class="form-error wide" role="alert" tabindex="-1" hidden></p><button class="button" type="submit">Save site settings</button></form></section>`; return;
  }
  if (tab === 'analytics') {
    const result = await api('/analytics?period=' + (params.get('period') || '7d'), { signal }); const data = result.data;
    content.innerHTML = `<div class="admin-toolbar"><nav class="tabs">${['7d', '30d', '90d'].map(period => `<a href="#/admin/analytics?period=${period}" class="${(params.get('period') || '7d') === period ? 'active' : ''}">${period.replace('d', ' days')}</a>`).join('')}</nav><button class="text-button" data-export-analytics>Export CSV</button></div><div class="admin-stats">${Object.entries(data.totals).map(([key, count]) => `<div class="admin-stat"><strong>${Number(count).toLocaleString()}</strong><small>${e(key)}</small></div>`).join('')}</div><h2>Most read series</h2><br>${table(['Story', 'Views', 'Rating / 10'], data.topSeries.map(s => `<tr><td>${e(s.title)}</td><td>${Number(s.views)}</td><td>${Number(s.rating)}</td></tr>`))}`;
    content.querySelector('[data-export-analytics]').onclick = () => { const csv = [['Title', 'Views', 'Rating'], ...data.topSeries.map(s => [s.title, s.views, s.rating])].map(row => row.map(v => '"' + String(v).replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n'); saveFile(csv, 'bangla-scan-analytics.csv', 'text/csv'); }; return;
  }
  if (tab === 'chapters') {
    const series = await allPages('/series?visibility=all&sort=title', signal);
    if (!context.seriesId) context.seriesId = idOf(series[0]);
    content.innerHTML = `<form id="chapter-series-form" class="inline-form"><label>Choose a series<select name="seriesId">${series.map(s => `<option value="${idOf(s)}" ${idOf(s) === context.seriesId ? 'selected' : ''}>${e(s.title)}</option>`).join('')}</select></label><button class="button button-secondary" type="submit">Open chapters</button></form><br>`;
    if (!context.seriesId) { content.insertAdjacentHTML('beforeend', empty('Create a series first', 'Chapters need a parent series.')); return; }
    context.endpoint = '/chapters';
    context.items = await allPages('/chapters/series/' + context.seriesId + '?sort=chapterNumber', signal);
  } else {
    context.endpoint = ({ series: '/series', genres: '/genres', homepage: '/homepage/sections', upcoming: '/homepage/upcoming', drives: '/admin/drives', users: '/admin/users', admins: '/admin/admins' })[tab];
    const query = tab === 'series' ? '?visibility=all&sort=-updatedAt' : '';
    context.items = await allPages(context.endpoint + query, signal);
    content.innerHTML = '';
  }
  if (signal.aborted) return;
  if (tab === 'drives') await renderStorageSummary(content, signal);
  if (tab === 'series') content.insertAdjacentHTML('beforeend', '<form id="bulk-series-form" class="inline-form"><label>Selected series visibility<select name="visibility"><option value="draft">Draft</option><option value="public">Public</option><option value="private">Private</option></select></label><button class="button button-secondary" type="submit">Apply to selected</button><p data-form-error class="form-error" role="alert" tabindex="-1" hidden></p></form>');
  content.insertAdjacentHTML('beforeend', `${['series', 'users', 'chapters'].includes(tab) ? '<label class="admin-search">Filter this list<input type="search" data-admin-search placeholder="Type a title, username or chapter…"></label>' : ''}${tab === 'drives' ? '<button class="button button-secondary" data-admin-action="health-check">Check all storage accounts</button>' : ''}<div class="admin-toolbar"><p>${context.items.length} ${e(tab)}${tab === 'chapters' ? ' · Upload images or one ZIP / CBZ per batch' : ''}</p>${tab !== 'users' ? action('new', '', tab === 'drives' ? '+ Connect storage' : '+ Add ' + ({ series: 'series', chapters: 'chapter', homepage: 'section', upcoming: 'upcoming story', genres: 'genre', admins: 'team member' })[tab]) : ''}</div>${context.items.length ? table(['Name', 'Status', 'Details', 'Actions'], context.items.map(item => row(item, tab))) : tab === 'drives' ? empty('Google Drive is optional', 'Server storage is ready. Connect Drive if you want another storage provider.') : empty('Nothing here yet', 'Add your first item to get started.')}`);
}
async function edit(item = {}) {
  const { tab, endpoint, seriesId } = context;
  const current = context;
  if (tab === 'drives' && idOf(item)) item = { ...item, label: item.name };
  const editing = Boolean(idOf(item));
  const defs = (tab === 'drives' && editing ? [['label', 'Label'], ['rootFolderId', 'Root folder ID'], ['chapterFolderId', 'Chapter folder ID'], ['coverFolderId', 'Cover folder ID'], ['priority', 'Storage priority', 'number'], ['totalGB', 'Capacity in GB', 'number'], ['isActive', 'Account enabled', 'checkbox']] : fields[tab]).filter(([name]) => !(tab === 'admins' && editing && ['email', 'password'].includes(name)));
  const genreOptions = ['series', 'homepage'].includes(tab) ? (await api('/genres')).data : [];
  const seriesOptions = tab === 'homepage' ? await allPages('/series?visibility=all&sort=title') : [];
  const extraFields = tab === 'series' ? `<label class="wide">Genres<select name="genres" multiple size="5">${genreOptions.map(g => `<option value="${idOf(g)}" ${(item.genres || []).some(v => String(v._id || v) === idOf(g)) ? 'selected' : ''}>${e(g.name)}</option>`).join('')}</select><small>Choose one or more genres.</small></label>` : tab === 'homepage' ? `<label>Genre (genre section)<select name="genreId"><option value="">Choose a genre</option>${genreOptions.map(g => `<option value="${idOf(g)}" ${String(item.genreId?._id || item.genreId) === idOf(g) ? 'selected' : ''}>${e(g.name)}</option>`).join('')}</select></label><label class="wide">Stories (custom section)<select name="seriesIds" multiple size="5">${seriesOptions.map(s => `<option value="${idOf(s)}" ${(item.seriesIds || []).map(String).includes(idOf(s)) ? 'selected' : ''}>${e(s.title)}</option>`).join('')}</select></label>` : '';
  const dialog = openDialog(`${editing ? 'Edit' : 'Add'} ${tab === 'homepage' ? 'homepage section' : tab === 'admins' ? 'team member' : tab}`, `<form id="admin-editor" class="form-grid">${defs.filter(([key]) => !['genreId', 'seriesIds'].includes(key)).map(f => field(tab === 'chapters' && !editing && f[0] === 'visibility' ? [f[0], f[1], ['draft', 'private', 'scheduled']] : f, item)).join('')}${extraFields}${tab === 'upcoming' ? `<label class="wide">Cover image URL<input name="coverImageUrl" type="text" placeholder="https://… or /api/media/…" value="${e(item.coverImage?.url || '')}"></label>` : ''}${tab === 'homepage' ? `<label class="wide">Banner image URL<input name="bannerImageUrl" type="text" placeholder="https://… or /api/media/…" value="${e(item.bannerImage?.url || '')}"></label>` : ''}${tab === 'admins' ? `<fieldset class="wide"><legend>Permissions</legend>${permissionKeys.map(key => `<label class="checkbox-label"><input type="checkbox" name="permission:${key}" ${item.permissions?.[key] ? 'checked' : ''}>${key.replace(/([A-Z])/g, ' $1')}</label>`).join('')}</fieldset>` : ''}<p data-form-error class="form-error wide" role="alert" tabindex="-1" hidden></p><div class="dialog-actions wide"><button class="button" type="submit">Save changes</button></div></form>`);
  if (tab === 'series' && !editing) dialog.querySelector('[name="type"]').onchange = event => { dialog.querySelector('[name="defaultReadingDirection"]').value = event.target.value === 'manga' ? 'rtl' : event.target.value === 'comic' ? 'ltr' : 'vertical'; };
  dialog.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.target; const button = form.querySelector('[type=submit]'); button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      defs.forEach(([key, , type]) => { if (type === 'checkbox') values[key] = form.elements[key].checked; if (type === 'number') { if (values[key] === '') delete values[key]; else values[key] = Number(values[key]); } if (type === 'datetime-local') { if (values[key]) values[key] = new Date(values[key]).toISOString(); else delete values[key]; } });
      if (tab === 'series') values.genres = [...form.elements.genres.selectedOptions].map(option => option.value);
      if (tab === 'series') values.tags = values.tags.split(',').map(v => v.trim()).filter(Boolean);
      if (tab === 'homepage') { values.seriesIds = [...form.elements.seriesIds.selectedOptions].map(option => option.value); if (!values.genreId) delete values.genreId; }
      if (tab === 'chapters') values.seriesId = seriesId;
      if (tab === 'admins') { values.permissions = {}; permissionKeys.forEach(key => { values.permissions[key] = Boolean(values['permission:' + key]); delete values['permission:' + key]; }); if (!editing && !values.password) throw new Error('An initial password is required.'); }
      if (tab === 'drives' && !editing) values.credentials = JSON.parse(values.credentials);
      for (const [section, key] of [['upcoming', 'coverImage'], ['homepage', 'bannerImage']]) {
        if (tab !== section) continue;
        const url = values[key + 'Url'].trim();
        values[key] = url === item[key]?.url ? item[key] : { url };
        delete values[key + 'Url'];
      }
      await api(endpoint + (editing ? '/' + idOf(item) : ''), { method: editing ? tab === 'drives' ? 'PATCH' : 'PUT' : 'POST', body: values });
      dialog.close(); toast('Changes saved.'); await renderAdmin(current.root, current.tab, current.params, current.signal);
    } catch (error) { formError(form, error); } finally { button.disabled = false; }
  });
}
function upload(item, media = false) {
  const current = context;
  const dialog = openDialog(media ? 'Upload cover or banner' : 'Upload chapter pages', `<p class="admin-help">${media ? 'Choose a JPEG, PNG, GIF or WebP image.' : 'Images are sorted naturally by filename. Upload up to 20 images (up to 10 MB each, subject to the server limit), or one ZIP / CBZ. Archives may contain at most 200 images and 80 MB expanded.'}</p><form id="upload-form">${media ? '<label>Image role<select name="type"><option value="cover">Cover</option><option value="banner">Banner</option></select></label>' : ''}<label>${media ? 'Image' : 'Pages or archive'}<input type="file" name="files" accept="image/jpeg,image/png,image/webp,image/gif${media ? '' : ',.zip,.cbz'}" ${media ? '' : 'multiple'} required></label>${!media ? '<label class="checkbox-label"><input type="checkbox" name="publishChapter">Publish this chapter after upload</label>' + (allowed('manageSeries') ? '<label class="checkbox-label"><input type="checkbox" name="publishSeries">Also publish its parent series</label>' : '') : ''}<p class="upload-status" role="status"></p><p data-form-error class="form-error" role="alert" tabindex="-1" hidden></p><button class="button" type="submit">${icon('upload')} Upload ${media ? 'image' : 'pages'}</button></form>`);
  dialog.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.target; const button = form.querySelector('[type=submit]'); button.disabled = true;
    try {
      const payload = new FormData(); const files = [...form.elements.files.files];
      if (files.length > 20) throw new Error('Choose no more than 20 files per batch.');
      files.forEach(file => payload.append(media ? 'file' : 'pages', file));
      payload.set('seriesId', media ? idOf(item) : current.seriesId);
      if (media) payload.set('type', form.elements.type.value); else payload.set('chapterId', idOf(item));
      form.querySelector('.upload-status').textContent = 'Uploading comic pages. Keep this dialog open…';
      await api('/uploads/' + (media ? 'single' : 'pages'), { method: 'POST', body: payload, signal: AbortSignal.timeout(300000) });
      if (!media && form.elements.publishChapter?.checked) await api('/chapters/' + idOf(item), { method: 'PUT', body: { visibility: 'public' } });
      if (!media && form.elements.publishSeries?.checked) await api('/series/' + current.seriesId, { method: 'PUT', body: { visibility: 'public' } });
      dialog.close(); toast('Upload complete.'); await renderAdmin(current.root, current.tab, current.params, current.signal);
    } catch (error) { formError(form, error); form.querySelector('.upload-status').textContent = 'Upload did not complete. Check storage and try again.'; } finally { button.disabled = false; }
  });
}
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-admin-action]'); if (!button || button.disabled) return;
  const item = context.items.find(item => idOf(item) === button.dataset.id);
  const action = button.dataset.adminAction;
  try {
    if (action === 'new' || action === 'edit') await edit(item);
    else if (action === 'pages') await editPages(item, () => renderAdmin(context.root, context.tab, context.params, context.signal));
    else if (action === 'health-check') { button.disabled = true; await api('/admin/drives/health-check', { method: 'POST', signal: AbortSignal.timeout(120000) }); toast('Storage health checks complete.'); await renderAdmin(context.root, context.tab, context.params, context.signal); }
    else if (action === 'upload' || action === 'media') upload(item, action === 'media');
    else if (action === 'reconnect') { button.disabled = true; await api('/admin/drives/' + idOf(item) + '/reconnect', { method: 'POST', signal: AbortSignal.timeout(60000) }); toast('Storage reconnected.'); }
    else if (action === 'delete') {
      const current = context;
      const dialog = openDialog('Delete this item?', `<p>This permanently removes ${e(item.title || item.name || item.username || 'this item')}${context.tab === 'series' ? ' and its chapters' : ''}. This cannot be undone.</p><form id="delete-confirm"><div class="dialog-actions"><button class="button danger-button button-secondary" type="submit">Delete permanently</button></div><p data-form-error class="form-error" role="alert" tabindex="-1" hidden></p></form>`);
      dialog.querySelector('form').addEventListener('submit', async event => { event.preventDefault(); const form = event.target; const submit = form.querySelector('button'); submit.disabled = true; try { await api(current.endpoint + '/' + idOf(item), { method: 'DELETE' }); dialog.close(); toast('Item deleted.'); await renderAdmin(current.root, current.tab, current.params, current.signal); } catch (error) { formError(form, error); submit.disabled = false; } });
    }
  } catch (error) { toast(error.message); } finally { button.disabled = false; }
});
document.addEventListener('submit', async event => {
  const form = event.target;
  if (form.id === 'chapter-series-form') { event.preventDefault(); location.hash = '/admin/chapters?seriesId=' + encodeURIComponent(new FormData(form).get('seriesId')); }
  if (form.id === 'bulk-series-form') {
    event.preventDefault(); const button = form.querySelector('button'); button.disabled = true;
    try { const ids = [...document.querySelectorAll('[data-bulk-series]:checked')].map(input => input.dataset.bulkSeries); if (!ids.length) throw new Error('Select at least one series.'); const result = await api('/admin/series/bulk-update', { method: 'POST', body: { ids, update: { visibility: new FormData(form).get('visibility') } } }); toast(result.message); await renderAdmin(context.root, context.tab, context.params, context.signal); } catch (error) { formError(form, error); } finally { button.disabled = false; }
  }
  if (form.id === 'site-settings-form') {
    event.preventDefault(); const button = form.querySelector('[type=submit]'); button.disabled = true;
    try { const values = Object.fromEntries(new FormData(form)); form.querySelectorAll('[type=checkbox]').forEach(input => { values[input.name] = input.checked; }); await api('/settings', { method: 'PUT', body: values }); window.dispatchEvent(new CustomEvent('bs:settings', { detail: values })); toast('Site settings saved.'); }
    catch (error) { formError(form, error); } finally { button.disabled = false; }
  }
});

document.addEventListener('input', event => { if (event.target.matches('[data-admin-search]')) document.querySelectorAll('#admin-content tbody tr').forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(event.target.value.toLowerCase()); }); });
