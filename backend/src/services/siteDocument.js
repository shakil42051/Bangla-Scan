'use strict';
const escape = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const publicURL = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
module.exports = (html, settings = {}) => {
  const title = settings.seo?.defaultMetaTitle || 'Bangla Scan — Manga, Manhwa, Manhua & Comics';
  const description = settings.seo?.defaultMetaDescription || settings.siteDescription || 'Read manga, manhwa, manhua and comics in Bangla. Discover new series, follow chapter updates, and build your personal collection.';
  const extra = [`<meta property="og:title" content="${escape(title)}">`, `<meta property="og:description" content="${escape(description)}">`, '<meta property="og:type" content="website">'];
  const canonical = publicURL(settings.siteUrl); if (canonical) extra.push(`<link rel="canonical" href="${escape(canonical)}">`, `<meta property="og:url" content="${escape(canonical)}">`);
  if (settings.seo?.googleSiteVerification) extra.push(`<meta name="google-site-verification" content="${escape(settings.seo.googleSiteVerification)}">`);
  return html.replace(/<title>.*?<\/title>/s, () => `<title>${escape(title)}</title>`).replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${escape(description)}">`).replace('</head>', () => extra.join('\n') + '\n</head>');
};
