const render = require('../src/services/siteDocument');
const html = '<head><title>Old</title><meta name="description" content="Old"></head>';
test('metadata replacement metacharacters remain literal', () => {
  const result = render(html, { seo: { defaultMetaTitle: '$& $` $\'', defaultMetaDescription: '$&' } });
  expect(result).toContain('<title>$&amp; $` $&#39;</title>');
  expect(result).toContain('name="description" content="$&amp;"');
});
test('public metadata and verification are rendered into the original HTML response', () => {
  const result = render(html, { siteUrl: 'https://example.com', seo: { defaultMetaTitle: 'Manga in Bangla', defaultMetaDescription: 'New chapters', googleSiteVerification: 'verify-token' } });
  expect(result).toContain('<title>Manga in Bangla</title>');
  expect(result).toContain('name="google-site-verification" content="verify-token"');
  expect(result).toContain('rel="canonical" href="https://example.com/"');
});
test('metadata cannot introduce executable HTML or invalid canonical URLs', () => {
  const result = render(html, { siteUrl: 'javascript:alert(1)', seo: { defaultMetaTitle: '</title><script>alert(1)</script>', defaultMetaDescription: '" onload="alert(1)' } });
  expect(result).not.toContain('<script>'); expect(result).not.toContain('rel="canonical"');
  expect(result).toContain('&lt;script&gt;'); expect(result).toContain('&quot; onload=');
});
