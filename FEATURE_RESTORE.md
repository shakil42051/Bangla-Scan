# Comic platform feature map

Bangla Scan is for manga, manhwa, manhua, webtoons and comics in Bangla. Diary notes, reading streaks/statistics, book font controls, text-to-speech and PDF/EPUB controls are absent from the active application. Translator notes remain a publishing feature.

| Area | Available functionality |
| --- | --- |
| Discovery | Cover-first directory, formats, genre/status/tag/year/language/rating filters, rankings and random public series |
| Releases | Real chapter feed, followed-series updates and direct chapter links |
| Comic tracking | Currently reading, Read later, Completed, On hold, Dropped, list search/export, account progress/history and device page bookmarks |
| Reader | Vertical/single/double pages, RTL/LTR, width/background/gap controls, fullscreen, chapter/page navigation and shortcuts |
| Community | Discussions, replies, spoilers, likes, own editing/deletion and owner moderation |
| Notifications | New chapter alerts, opt-out, unread filtering, mark/dismiss controls |
| Accounts | Reader/team separation, registration/login, profile/preferences, password change and SMTP-backed recovery/verification |
| Publishing | Series/chapter CRUD, genres, creators, tags, translator notes, draft/public/private/scheduled visibility and bulk series changes |
| Chapter media | Image/ZIP/CBZ upload, natural ordering, previews, reordering/detachment, replacement and enabled CBZ downloads |
| Website artwork | Cover/banner/logo/favicon/homepage/upcoming uploads, media browsing, copied URLs and unused-file deletion |
| Homepage | Custom/genre/featured/latest/popular/trending/upcoming sections, banners, badges and ordering |
| Appearance | Indigo/cyan/emerald/rose accents, dark/light default, branding, SEO metadata and community links |
| Administration | Readers, team permissions, comments, access/maintenance controls, announcements and publisher analytics |
| Storage | Persistent server storage by default; optional Google Drive connections and health/capacity management |
| Backup/status | Catalog metadata export, database/email/upload/uptime status and storage usage |

The website now runs against real authenticated local MongoDB. Integration tests use a separate disposable database and verify login, uploads, ordering, access/publication, replacement, downloads, tracking, comments, branding and persistence. No sample comics are inserted into the live catalog.

Google Drive, SMTP delivery and Docker deployment require external configuration and remain unverified here. Catalog export is metadata-only; full backups also need database files, media and private configuration. See README.md for startup, publishing and backup instructions.