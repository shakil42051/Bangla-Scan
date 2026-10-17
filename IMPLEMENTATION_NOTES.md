# Implementation and verification

## Product and interface

The active site is a manga/manhwa/manhua/webtoon/comic platform in Bangla. It uses charcoal (#0b0d14), indigo actions (#4f46e5), lavender accents (#a5b4fc), cyan highlights (#67e8f9), dark/light themes and original optimized manga artwork. Discovery emphasizes covers, formats, chapter updates and genres.

Following the user's clarification, the reader menu contains Followed series, Read later, Reading history and Notifications. Diary notes, personal statistics/streaks, obsolete routes/models and styling were removed. Translator notes remain for comic publishing. Old implementations and the obsolete in-memory preview API are archived and excluded from the running website.

## Backend and publishing

- Repeatable local startup uses a checksum-verified official MongoDB Community runtime, project-local persistent data, loopback binding, authentication and separate database owner/application users.
- Generated private backend/.env.local for the working local setup; original backend/.env and cloud data were preserved. No cloud catalog is imported automatically.
- Persistent local image storage works without Google Drive. Images in drafts/restricted chapters use access-checked delivery. Browser media cookies are HTTP-only, path-scoped, audience-restricted and checked against the current active session.
- Media manager connects cover/banner/homepage/upcoming/logo/icon uploads, replacement, URL copying and unused-file deletion. Stored image references survive admin editing.
- Uploads enforce destination permissions, binary signatures, bounded memory, archive/page limits, natural path/filename order and archive metadata exclusion. Atomic page appends enforce chapter size under concurrent uploads.
- Publication requires pages, including scheduled publication. Page editing accepts existing references only, renumbers them and rejects injected URLs. Replacement updates references before retiring old media; referenced-file deletion is blocked.
- Manga defaults to RTL, comics to LTR, other formats to vertical scrolling; publishers can override.
- Comic progress/history, follows, notifications, comments/moderation, downloads, team permissions, settings and publisher analytics remain connected.
- Added storage usage/status and a persistent Docker media volume. External Google Drive and SMTP remain optional.

## Dependency maintenance

Updated archive, multipart upload, email, Google API, scheduler and compatible HTTP/database dependencies. Replaced nodemon with built-in Node watch mode. Scoped the test configuration loader to js-yaml 4 (it uses the compatible load API). The final full npm audit reports zero known vulnerabilities; this is a point-in-time dependency check.

## Verification

- 10 frontend regression tests pass.
- 36 backend HTTP/unit tests pass, including filesystem containment and protected media cookie restrictions.
- 16 real MongoDB integration checks pass: owner login, series/chapter creation, cover/CBZ upload, private/public access, page ordering and injection rejection, replacement, reader image sessions, CBZ download, progress/history, follows/comments/moderation, branding uploads, deletion guards, storage/export, logout revocation and persistence after reconnection.
- Integration fixtures use a unique disposable database/media directory and clean themselves. The real local catalog starts empty.
- Syntax, HTML ID, manifest, external-script checks and static production build pass. Build: 19 files, about 191 KB code plus 769 KB artwork, uncompressed.
- Real-browser checks cover owner sign-in, media upload destinations, manga format/genre/direction fields, storage status, responsive navigation and the comic-only reader menu. Final screenshots are under test-results.

## External configuration

The original cloud MongoDB hostname failed in the earlier audit. The separate local setup now works while preserving that cloud configuration. Google Drive and SMTP delivery need valid credentials and are not claimed as verified. Docker is unavailable here, so container execution is unverified. Local startup is for development; public deployment requires a suitable host, HTTPS, backups and private production settings.