// ===== PWA & SERVICE WORKER =====
let deferredPrompt = null;
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('pwa-install-banner');
  if (banner) { banner.style.display = 'flex'; setTimeout(()=>banner.style.display='none', 12000); }
});
function triggerPWAInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('pwa-install-banner').style.display = 'none';
  });
}

// ===== SIDEBAR OPEN/CLOSE WITH OVERLAY =====
function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('active');
}

// ===== SWIPE GESTURE NAVIGATION =====
(function() {
  const SWIPE_THRESHOLD = 60;
  const EDGE_THRESHOLD = 40;
  let startX = 0, startY = 0, startTime = 0;
  const tabs = ['home','library','stats','wishlist','explore','trending'];

  document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, {passive: true});

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    if (dt > 400 || Math.abs(dy) > Math.abs(dx) * 0.8) return;

    // Swipe from left edge → open sidebar
    if (startX < EDGE_THRESHOLD && dx > SWIPE_THRESHOLD && window.innerWidth < 768) {
      openSidebar(); return;
    }
    // Swipe right-to-left on sidebar → close
    if (dx < -SWIPE_THRESHOLD && document.getElementById('sidebar')?.classList.contains('open')) {
      closeSidebar(); return;
    }
  }, {passive: true});
})();

// ===== ADAPTIVE UI DETECTION =====
(function() {
  function applyDeviceClass() {
    const w = window.innerWidth;
    const body = document.body;
    body.classList.remove('device-mobile','device-tablet','device-desktop');
    if (w < 768) body.classList.add('device-mobile');
    else if (w < 1024) body.classList.add('device-tablet');
    else body.classList.add('device-desktop');
    // Touch vs pointer
    const isTouch = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
    body.classList.toggle('is-touch', isTouch);
    // Android detection
    const isAndroid = /android/i.test(navigator.userAgent);
    body.classList.toggle('is-android', isAndroid);
  }
  applyDeviceClass();
  window.addEventListener('resize', applyDeviceClass);
})();

// ===== MATERIAL DESIGN RIPPLE ENGINE =====
(function() {
  function createRipple(e) {
    const btn = e.currentTarget;
    // Only on touch/click — skip if it's inside an input
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX || (rect.left + rect.width/2)) - rect.left - radius;
    const y = (e.clientY || (rect.top + rect.height/2)) - rect.top - radius;

    circle.className = 'ripple-wave';
    circle.style.cssText = `width:${diameter}px;height:${diameter}px;left:${x}px;top:${y}px;`;
    // Remove any old ripple
    btn.querySelector('.ripple-wave')?.remove();
    btn.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove(), {once:true});
  }

  function attachRipples() {
    const targets = document.querySelectorAll(
      '.btn-primary,.btn-outline,.filter-btn,.nav-item,.adm-save,.adm-act-btn,.adm-nav-item,.cat-chip,.genre-tag,.auth-tab,.reader-theme-btn,.font-family-btn,.margin-btn,.book-read-btn'
    );
    targets.forEach(el => {
      if (el.dataset.ripple) return;
      el.dataset.ripple = '1';
      el.classList.add('ripple-container');
      el.addEventListener('pointerdown', createRipple);
    });
  }
  // Attach on load and after any navTo (content changes)
  document.addEventListener('DOMContentLoaded', attachRipples);
  const origNavTo = window.navTo;
  if (typeof navTo === 'function') {
    window.navTo = function(...args) { origNavTo?.(...args); setTimeout(attachRipples, 120); };
  }
  setTimeout(attachRipples, 600);
})();

// ===== ANDROID VIBRATION HAPTICS =====
function vibrateLight() { navigator.vibrate?.(10); }
function vibrateMedium() { navigator.vibrate?.(25); }
function vibrateSuccess() { navigator.vibrate?.([15, 50, 15]); }
function vibrateError() { navigator.vibrate?.([30, 80, 30, 80, 30]); }

// Hook haptics into key actions
(function() {
  document.addEventListener('pointerdown', e => {
    const el = e.target?.closest('.nav-item,.filter-btn,.cat-chip,.genre-tag,.auth-tab');
    if (el) vibrateLight();
  });
  document.addEventListener('pointerdown', e => {
    const el = e.target?.closest('.btn-primary,.adm-save,.btn-read,.book-read-btn');
    if (el) vibrateMedium();
  });
})();

// ===== ANDROID SHARE API (replaces clipboard fallback) =====
function shareBook(id) {
  const b = BOOKS.find(x=>x.id===id) || WISHLIST.find(x=>x.id===id);
  if (!b) return;
  const shareData = {
    title: b.title,
    text: `Check out "${b.title}" by ${b.author} on Bangla Scan!`,
    url: window.location.href
  };
  if (navigator.share && navigator.canShare?.(shareData)) {
    vibrateMedium();
    navigator.share(shareData).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`"${b.title}" by ${b.author} — Bangla Scan`)
      .then(() => showToast('📋 Copied to clipboard'));
  } else {
    showToast('📋 ' + b.title + ' by ' + b.author);
  }
}

// ===== NETWORK / OFFLINE STATUS =====
(function() {
  const banner = document.getElementById('offline-banner');
  function setOnline() {
    banner?.classList.remove('show');
    document.getElementById('offline-banner-msg') && (document.getElementById('offline-banner-msg').textContent = '');
  }
  function setOffline() {
    if (banner) {
      banner.classList.add('show');
      banner.textContent = '⚠️ You are offline — reading from cache';
    }
    showToast('📶 No internet connection');
  }
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOffline);
  if (!navigator.onLine) setOffline();
})();

// ===== ANDROID DYNAMIC THEME-COLOR =====
function updateAndroidThemeColor(theme) {
  const colors = {
    light: '#f0f2f8', dark: '#0a0d14',
    midnight: '#040914', sakura: '#fff5f8', ocean: '#081c22'
  };
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.content = colors[theme] || '#7c3aed';
}
// Override setAppTheme to also update Android theme color
const _origSetAppTheme = window.setAppTheme;
if (typeof setAppTheme === 'function') {
  window.setAppTheme = function(t) {
    _origSetAppTheme?.(t);
    updateAndroidThemeColor(t);
  };
}

// ===== ANDROID KEYBOARD RESIZE FIX =====
// Prevents layout jumping when Android soft keyboard opens
(function() {
  if (!window.visualViewport) return;
  const vv = window.visualViewport;
  vv.addEventListener('resize', () => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      setTimeout(() => activeEl.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
    }
  });
})();

// =====================================================================
//  RESPONSIVE UI HELPERS
// =====================================================================
(function initResponsiveUI() {
  // ---- Patch navTo to also update bottom nav items ----
  const _origNavTo = window.navTo;
  window.navTo = function(s) {
    if (typeof _origNavTo === 'function') _origNavTo(s);
    // Map tab → abn-item id
    const navMap = {
      home: 'abn-home',
      library: 'abn-library',
      explore: 'abn-explore',
      trending: 'abn-trending',
      settings: 'abn-settings',
      stats: 'abn-settings',
      wishlist: 'abn-library'
    };
    document.querySelectorAll('.abn-item').forEach(el => el.classList.remove('active'));
    const targetId = navMap[s];
    if (targetId) document.getElementById(targetId)?.classList.add('active');
    vibrateLight?.();
  };

  // ---- Update avatar icon in bottom nav ----
  function updateAbnAvatar() {
    const iconEl = document.getElementById('abn-avatar-icon');
    if (!iconEl) return;
    const avatarEl = document.getElementById('topbar-avatar');
    if (avatarEl && avatarEl.textContent && avatarEl.textContent.trim().length <= 3) {
      iconEl.textContent = '';
      iconEl.style.cssText = `
        width:24px;height:24px;border-radius:50%;
        background:var(--gradient-accent);color:white;
        font-size:11px;font-weight:800;
        display:inline-flex;align-items:center;justify-content:center;
        box-shadow:0 0 0 2px rgba(124,58,237,0.3);
      `;
      iconEl.textContent = avatarEl.textContent.trim();
    }
  }

  // Hook into startSession to update avatar
  const _origStartSession = window.startSession;
  window.startSession = function(...args) {
    if (typeof _origStartSession === 'function') _origStartSession(...args);
    setTimeout(updateAbnAvatar, 200);
  };
})();

// =====================================================================
//  MOBILE SEARCH OVERLAY
// =====================================================================
function openMobileSearch() {
  const overlay = document.getElementById('mobile-search-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  // Focus input after animation
  setTimeout(() => {
    const inp = document.getElementById('mobile-search-input');
    if (inp) { inp.value = ''; inp.focus(); }
    document.getElementById('mobile-search-results').innerHTML = `
      <div class="mobile-search-empty">
        <div style="font-size:36px">🔍</div>
        <div style="font-size:14px;font-weight:700;color:var(--text-secondary)">Search for books</div>
        <div style="font-size:12px">Type to find titles, authors, or genres</div>
      </div>`;
  }, 80);
  vibrateLight?.();
}

function closeMobileSearch() {
  const overlay = document.getElementById('mobile-search-overlay');
  if (overlay) overlay.classList.remove('open');
  const inp = document.getElementById('mobile-search-input');
  if (inp) inp.blur();
}

function mobileSearchQuery(q) {
  const resultsEl = document.getElementById('mobile-search-results');
  if (!resultsEl) return;
  if (!q.trim()) {
    resultsEl.innerHTML = `
      <div class="mobile-search-empty">
        <div style="font-size:36px">🔍</div>
        <div style="font-size:14px;font-weight:700;color:var(--text-secondary)">Search for books</div>
        <div style="font-size:12px">Type to find titles, authors, or genres</div>
      </div>`;
    return;
  }
  const lq = q.toLowerCase();
  const all = [...(typeof BOOKS !== 'undefined' ? BOOKS : []),
               ...(typeof WISHLIST !== 'undefined' ? WISHLIST : [])]
    .filter(b => b.title?.toLowerCase().includes(lq)
             || b.author?.toLowerCase().includes(lq)
             || b.genre?.toLowerCase().includes(lq));
  if (!all.length) {
    resultsEl.innerHTML = `
      <div class="mobile-search-empty">
        <div style="font-size:36px">😕</div>
        <div style="font-size:14px;font-weight:700;color:var(--text-secondary)">No results for "${q}"</div>
        <div style="font-size:12px">Try a different title or author</div>
      </div>`;
    return;
  }
  resultsEl.innerHTML = all.map(b => {
    const p = (typeof progress !== 'undefined' ? progress[b.id] : null) ?? b.progress ?? 0;
    const isWish = b.status === 'wishlist';
    return `<div class="book-card" onclick="closeMobileSearch();openBook(${b.id},${isWish})">
      <div class="book-cover-wrap">
        <img src="${b.cover}" alt="${b.title}" loading="lazy"/>
        <div class="book-genre-badge">${b.genre}</div>
        <div class="book-progress-mini"><div class="book-progress-fill" style="width:${p}%"></div></div>
      </div>
      <div class="book-title">${b.title}</div>
      <div class="book-author">${b.author}</div>
    </div>`;
  }).join('');
}

// Close search overlay on Mobile back button
window.addEventListener('popstate', () => {
  const overlay = document.getElementById('mobile-search-overlay');
  if (overlay?.classList.contains('open')) {
    closeMobileSearch();
  }
});

// ===================== PASSWORD TOGGLE =====================
function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  // Swap eye icon: open-eye = visible, eye-slash = hidden
  btn.querySelector('svg').innerHTML = isHidden
    ? /* eye-slash */
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : /* eye-open */
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
}

// ===== COMIC READER LOGIC =====
let currentComicSeries = null;
let currentComicChapterIdx = 0;
let comicDirection = 'vertical';
let comicFit = true;
let comicUiVisible = true;

function goBackFromSeries() {
    showPage('dashboard');
}

function openSeries(id) {
    const series = BOOKS.find(b => b.id === id) || WISHLIST.find(b => b.id === id);
    if(!series) return;
    currentComicSeries = series;
    
    document.getElementById('series-banner-img').src = series.cover;
    document.getElementById('series-cover-img').src = series.cover;
    document.getElementById('series-title').innerText = series.title;
    document.getElementById('series-alt-title').innerText = series.altTitle || "Alternative Title N/A";
    document.getElementById('series-author').innerText = series.author;
    document.getElementById('series-rating').innerText = series.rating || "N/A";
    document.getElementById('series-views').innerText = series.views || Math.floor(Math.random()*100000);
    document.getElementById('series-year').innerText = series.year || "2026";
    document.getElementById('series-status').innerText = series.status === 'completed' ? 'Completed' : 'Ongoing';
    document.getElementById('series-desc').innerHTML = series.description || "No description available.";
    
    // tags
    const tagsDiv = document.getElementById('series-tags');
    tagsDiv.innerHTML = `<span class="cat-chip">${series.genre}</span>`;
    if (series.tags) {
        series.tags.forEach(t => {
            tagsDiv.innerHTML += `<span class="cat-chip">${t}</span>`;
        });
    }

    // chapters
    const chList = document.getElementById('series-chapter-list');
    chList.innerHTML = '';
    const chapters = series.chapters || [];
    document.getElementById('series-chapter-count').innerText = `${chapters.length} Chapters`;
    
    chapters.forEach((ch, idx) => {
        chList.innerHTML += `
        <div class="chapter-item ${ch.done ? 'read-status' : ''}" onclick="openComicChapter(${idx})">
            <div class="chapter-item-left">
                <span class="chapter-num">Chapter ${idx+1}: ${ch.title}</span>
                <span class="chapter-date">${ch.date || 'Just now'}</span>
            </div>
            ${ch.done ? '<span class="chapter-item-right" style="background:transparent;color:var(--text-muted)">Read</span>' : '<span class="chapter-item-right">Unread</span>'}
        </div>`;
    });

    showPage('series-detail');
}

function readFirstOrLatestChapter() {
    if(!currentComicSeries) return;
    let idx = currentComicSeries.currentChapter || 0;
    openComicChapter(idx);
}

function openComicChapter(idx) {
    if(!currentComicSeries) return;
    currentComicSeries.currentChapter = idx;
    const chapters = currentComicSeries.chapters || [];
    if(idx < 0 || idx >= chapters.length) return;
    currentComicChapterIdx = idx;
    if(chapters[idx]) { chapters[idx].done = true; saveBooks(); }
    
    document.getElementById('comic-reader-title').innerText = currentComicSeries.title + " - Chapter " + (idx+1);
    
    // If it's a comic (Manga/Manhwa/Manhua/Comic), render images
    const isComic = ['Manga', 'Manhwa', 'Manhua', 'Comic'].includes(currentComicSeries.genre);
    if(isComic) {
        renderComicImages();
        showPage('comic-reader');
    } else {
        // Fallback to text reader for novels
        loadReader(currentComicSeries.id, idx);
        showPage('reader');
    }
}

function renderComicImages() {
    const content = document.getElementById('comic-content');
    content.innerHTML = '';
    
    // Mock images for demonstration
    const images = currentComicSeries.chapters[currentComicChapterIdx].images || [
        currentComicSeries.cover,
        currentComicSeries.cover,
        currentComicSeries.cover
    ];
    
    document.getElementById('comic-progress').innerText = `1 / ${images.length}`;
    
    images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'comic-page loaded';
        img.loading = 'lazy';
        content.appendChild(img);
    });
    
    applyComicSettings();
}

function closeComicReader() {
    showPage('series-detail');
}

function toggleComicSettings() {
    document.getElementById('comic-settings').classList.toggle('open');
}

function setComicDirection(dir) {
    comicDirection = dir;
    document.querySelectorAll('.comic-dir-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-dir-' + (dir==='vertical'?'v':dir)).classList.add('active');
    applyComicSettings();
}

function toggleComicFit(el) {
    el.classList.toggle('on');
    comicFit = el.classList.contains('on');
    applyComicSettings();
}

function applyComicSettings() {
    const content = document.getElementById('comic-content');
    content.className = 'comic-content' + (!comicFit ? ' fullscreen' : '');
    
    if(comicDirection === 'ltr') {
        content.classList.add('comic-mode-h');
    } else if(comicDirection === 'rtl') {
        content.classList.add('comic-mode-h');
        content.classList.add('comic-mode-rtl');
    }
}

function toggleComicUI() {
    comicUiVisible = !comicUiVisible;
    if(comicUiVisible) {
        document.getElementById('comic-topbar').classList.remove('hidden');
        document.getElementById('comic-bottombar').classList.remove('hidden');
    } else {
        document.getElementById('comic-topbar').classList.add('hidden');
        document.getElementById('comic-bottombar').classList.add('hidden');
        document.getElementById('comic-settings').classList.remove('open');
    }
}

function comicTapLeft() {
    if(comicDirection === 'rtl') nextComicPage();
    else prevComicPage();
}

function comicTapRight() {
    if(comicDirection === 'rtl') prevComicPage();
    else nextComicPage();
}

function nextComicPage() {
    if(comicDirection === 'vertical') { window.scrollBy({top: window.innerHeight*0.8, behavior:'smooth'}); return; }
    document.getElementById('comic-content').scrollBy({left: window.innerWidth, behavior:'smooth'});
}

function prevComicPage() {
    if(comicDirection === 'vertical') { window.scrollBy({top: -window.innerHeight*0.8, behavior:'smooth'}); return; }
    document.getElementById('comic-content').scrollBy({left: -window.innerWidth, behavior:'smooth'});
}

function nextComicChapter() { openComicChapter(currentComicChapterIdx + 1); }
function prevComicChapter() { openComicChapter(currentComicChapterIdx - 1); }

function toggleSeriesBookmark() {
    const btn = document.getElementById('series-bookmark-btn');
    btn.classList.toggle('active');
    showToast("Bookmark updated!");
}