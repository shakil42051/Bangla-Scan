# Bangla Scan

A Bangla manga, manhwa, manhua, webtoon and comic platform, with a page reader and a connected publishing studio. The active website is index.html + assets/; Express serves the website and API together.

## Start locally

```powershell
npm --prefix backend ci
npm run local
```

Open **http://localhost:5000**. Choose **Sign in → Content team sign in** and use ADMIN_EMAIL and ADMIN_PASSWORD from **backend/.env.local**. This private file was generated for the real local setup; passwords are not printed in startup logs. The existing backend/.env and its cloud configuration are preserved. Cloud catalog data is not imported automatically.

The first Windows run downloads the official MongoDB Community 8.0.34 runtime (about 808 MB), verifies its published SHA-256 checksum, and creates an authenticated project-local database. The runtime is reused. Node.js 20+ is required. On another OS, install MongoDB Community and set MONGOD_BINARY to its mongod executable. No Windows service is installed. MongoDB listens only on loopback port 27018; the application uses a separate database user.

Keep the command running while using the website. Ctrl+C stops it; npm run local reopens the same data. npm start instead uses backend/.env or injected environment variables for a separately managed database. npm run dev is an optional frontend proxy at localhost:3000 targeting the real backend at port 5000.

## Publish comics

1. **Content studio → Series → Add series**: enter title, format, creators, genres, synopsis and tags. Manga defaults to RTL, comics to LTR, and other formats to vertical scrolling. Override the direction when needed.
2. Use **Cover** beside the saved series to upload its cover/banner.
3. Open **Chapters**, add a draft chapter, then **Upload pages**. Select images or one ZIP/CBZ. Pages sort naturally by path and filename; archive metadata is ignored.
4. Use **Page order** to preview, reorder or detach pages. Media manager can replace an image everywhere it is referenced.
5. Publish both the chapter and its parent series through the upload checkboxes or Edit dialogs. Empty chapters cannot publish, including through the scheduler.

The live catalog starts empty, ready for your content. No sample stories/accounts are inserted. Reader accounts follow comics, save titles for later, sync chapter progress/history, discuss releases and receive notifications. Page bookmarks stay on the device. Diary notes and personal reading statistics were removed.

## Website management

Content studio provides series, chapters, genres, homepage sections, upcoming releases, media, readers, team roles, comments, publisher analytics, appearance and access settings. Appearance offers indigo/cyan/emerald/rose accents and dark/light defaults. Media manager uploads covers, banners, logos and website icons. Chapter page uploads belong to Chapters.

More contains mobile overflow destinations, without repeating Home, Updates, Browse, Follows or the account button. Saved pages now has its own screen with removal and JSON export. Readers can report missing pages, broken images, order problems or translation issues from the chapter reader; the team handles these under **Chapter reports**.

Appearance now controls the homepage headline, description and footer tagline. Reader defaults include layout, width, background and page spacing. **Upload policy** controls the accepted image formats and per-image limit within the server's hard cap. **Activity log** records team mutations for 90 days without request bodies or credentials. Reader and team settings support password changes and signing out everywhere.

## Personal settings and account recovery

Settings is organized into Appearance, Comic reader, More menu, Security & recovery, Reading privacy and Device backup. Readers can choose their own accent palette, interface text size, higher contrast, reduced motion, compact cards and data-saving cover placeholders. The comic reader still loads chapter pages. More shortcuts can be shown or hidden; core settings, security, backup and help remain accessible.

Reading privacy can pause new chapter-history records while retaining the current chapter/page for continuation. Device backup exports and restores a validated JSON file containing preferences and up to 500 page bookmarks. Credentials and login sessions are excluded. The clear-data action only removes the current account's reading data on this device; server follows and history remain.

Readers can sign in with their case-sensitive username or email. Team members use their email. New passwords need at least 12 characters, at most 72 UTF-8 bytes, and must avoid the blocked common/repeated values. Existing shorter passwords can still sign in so users can update them. Signup and reset forms confirm the new password and support password managers and pasting.

**Forgot password** supports both reader and team accounts; **Forgot username** sends the reader's username privately to the registered email. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM and a trusted PUBLIC_URL in the selected server environment file. Recovery returns the same response for existing and unknown accounts, throttles requests per account, and uses hashed, expiring, single-use tokens. Reset consumption is atomic, including concurrent requests. A successful reset revokes all sessions. Email delivery is asynchronous and bounded; if the process stops before delivery, request a fresh link after the cooldown. Live SMTP delivery requires your mail provider and has not been verified here. Production email transport requires TLS and recovery links require an HTTPS PUBLIC_URL.

Both reader and team accounts can enable authenticator-based two-step verification in **Settings → Security & recovery**. Enter the manual setup key in an authenticator, confirm a six-digit code, and save the eight recovery codes shown once. Authenticator steps and recovery codes cannot be reused. Recovery-code replacement and MFA disabling require the current password plus a second factor. Password reset retains MFA and also requires an authenticator or an unused recovery code when MFA is on. Email alone cannot disable it. If both the authenticator and all recovery codes are lost, the site team must handle verified recovery; there is no public bypass.

Set a stable AUTH_ENCRYPTION_KEY of at least 32 random characters before enabling MFA, and back it up securely. JWT_SECRET is used if it is omitted. Changing or losing the encryption key can make authenticator secrets unreadable; keep recovery codes separately. Recent sign-ins and security changes appear in Security, with masked network addresses and 30-day retention. AUTH_RATE_LIMIT_MAX controls the IP credential limit (default 20 per 15 minutes); per-identity throttles apply independently. Refresh tokens use scoped HTTP-only cookies and access tokens remain in memory. Legacy browser tokens are removed after a one-time migration. Current account sessions still use one rotating refresh session; signing in again replaces the prior refresh/media session.

Server media storage works immediately and survives restarts. Draft/restricted images are access checked, including browser image requests. Replacement updates stored references before retiring the old image. Deleting referenced images is blocked.

Upload limits: 20 images or one archive per batch, 200 pages per chapter, 80 MB compressed/expanded archive. Each image is limited by MAX_FILE_SIZE_MB, with a 10 MB hard maximum. File signatures are validated. Split large releases into chapters.

**Storage** supports server disk or a mounted volume, Google Drive, and an S3-compatible bucket (Amazon S3, Cloudflare R2, Backblaze B2 or MinIO). Configure a Drive connection in the studio or S3 credentials privately in the selected server environment file, then select the default upload destination in Storage. The UI disables unconfigured providers and offers connection checks and usage totals. Existing uploads retain their original provider.

S3 needs S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY. For compatible services set S3_ENDPOINT to the provider's HTTPS endpoint; R2 typically uses region `auto`. S3_PROVIDER_LABEL changes the studio label, S3_FORCE_PATH_STYLE enables path-style addressing where required, and S3_PREFIX chooses the object prefix. An optional S3_SESSION_TOKEN supports temporary credentials. Keep the bucket private and grant only the required bucket/object permissions. The server delivers images through the same permission checks as local media. One S3 bucket configuration is supported; keep its bucket, prefix and credentials available while stored images are in use. Changing the bucket is not a media migration.

New Drive uploads stay private; folders shared publicly or to a domain are rejected. If you previously used public Drive links, run **Storage → Secure previously public Drive images**. It revokes public/domain permissions and updates tracked website links in batches of 1000. Inherited folder permissions must be removed at their source if Google Drive refuses their removal. Used Drive connections cannot be deleted. Live S3/Drive calls require your provider credentials and have not been exercised on this machine.

STORAGE_ENCRYPTION_KEY optionally sets a dedicated stable secret for encrypted Drive credentials; otherwise JWT_SECRET is used. Back it up securely and keep it stable. Existing CBC records can be read; new or updated credentials use authenticated AES-256-GCM encryption. SMTP must be configured for email verification/password recovery; unavailable delivery is reported honestly.

## Persistence and backups

- Database: backend/.runtime/database
- Images: backend/data/media, or MEDIA_DIRECTORY
- Private local configuration: backend/.env.local
- MongoDB log: backend/.runtime/mongod.log

For a complete local backup, stop the local command and copy database files, media and private configuration together to a secure location. **Backup & system → Export catalog JSON** exports content metadata/public settings only; it is not a full account/media backup or an automatic restore tool. Runtime, credentials and uploads are excluded from Git and the Docker build context.

## Verification

```powershell
npm run build
npm test
npm --prefix backend test
npm run test:integration
npm run test:auth
```

The integration command needs npm run local running. It uses a random disposable database and temporary media directory, tests real login/uploads/publishing/downloads/tracking/persistence, customization, upload policy, chapter reports, audit logging and session revocation, and cleans its own fixtures. It never inserts samples into your actual catalog. Results: test-results/backend-integration.json.

The account-security integration command uses a separate disposable database. It captures all recovery email locally without sending it, and exercises username recovery, concurrent reset attempts, MFA setup/login/recovery-code replacement, expired tokens and team account recovery. Results: test-results/auth-integration.json.

The build packages frontend/dist without CDN scripts or remote fonts. Backend unit/HTTP tests do not require MongoDB. Frontend regression tests cover rendering, sessions, request handling and private cache exclusions.

## Deployment

For a separately managed database, configure backend/.env.example values privately, use strong distinct JWT secrets, configure storage, and run npm --prefix backend run seed once with ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters. Then npm start.

Docker Compose provides authenticated internal MongoDB, a database user limited to the application database, and persistent database/media volumes. Set distinct random hex MONGO_ROOT_PASSWORD and MONGO_APP_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, PUBLIC_URL and CLIENT_URL first. Hex database passwords avoid URI escaping errors. Run docker compose up --build, then docker compose exec backend node src/utils/seed.js once. The web port binds to the host loopback interface; use an HTTPS reverse proxy. Set TRUST_PROXY_HOPS only to the known number of proxy hops so rate limiting uses the correct client IP. Docker execution and SMTP delivery remain unverified on this machine.

Existing Compose database volumes created without authentication need users provisioned before switching to this configuration. The initialization script runs only for a new volume. Back up existing data, create the owner and application users in the existing database, then restart with the matching credentials. Do not delete a data volume to change authentication.

Serve Express, or frontend/dist behind a same-origin /api proxy. GitHub Pages hosts static files only, so login, uploads and reader accounts need a separately deployed Node backend and database. For a cross-origin backend, change the `api-base` meta tag in index.html to the backend API root (for example, `https://api.example.com/api`) and set the backend's `CLIENT_URL` to the exact website origin. Configure any host-level Content Security Policy to allow connections to the backend origin. Keep backend credentials in the hosting provider's private environment settings. Never expose the repository directory. The service worker excludes authenticated API responses and chapter media.

For the complete reader, serve the frontend and API on the same origin. The scoped private-media cookie is intentionally restricted to the same site, and cross-site static hosting can block it. An API base override alone does not provide a proxy for private comic images. Hosting Express with this frontend, or configuring a same-origin /api reverse proxy, supports all account and media flows.

## References

The import/publishing workflow was informed by [Komga's import guide](https://komga.org/docs/guides/import-books/) and [Kavita's API](https://www.kavitareader.com/docs/api/). Local database bootstrap follows [MongoDB's localhost exception](https://www.mongodb.com/docs/manual/core/localhost-exception/). No third-party artwork/branding was copied.

See FEATURE_RESTORE.md, IMPLEMENTATION_NOTES.md and ARTWORK.md for features, verification and artwork provenance. Old implementations and the obsolete sample API remain archived, outside the running/build source.

See SECURITY_REVIEW.md for the security changes, regression coverage and deployment checks.
