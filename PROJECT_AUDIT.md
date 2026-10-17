# Bangla Scan project audit

This records the original findings before the repair. See `IMPLEMENTATION_NOTES.md` for implemented fixes, current checks, and the remaining live-service setup.

Reviewed 15 October 2026. This is a source-code audit with executable checks, not a claim that every possible defect has been found. The browser preview could not reach the local server, so responsive appearance, screenshots, touch behavior, and complete user journeys remain unverified. No application code was changed.

## Assessment

The application needs functional consolidation before a visual redesign. The root `index.html` is the real application (6,940 lines, approximately 448 KB). `frontend/` is a separate Next.js starter. Authentication, rendering, and data loading are repeatedly overridden by additional scripts. The most urgent problems are unauthorized chapter access, a reproducible rating-rendering crash, broken production chapter URLs, and inconsistent reading data.

UI strengths worth preserving: cover-led discovery, a mobile bottom navigation, reader appearance controls, lazy-loaded cover images, some labeled inputs, and a global keyboard focus outline. The priority is making these consistent and reliable.

## Verified checks and limitations

| Check | Result |
|---|---|
| Frontend ESLint | Passed; covers the starter frontend, not the root application |
| Next.js production build | Failed fetching Geist and Geist Mono from Google Fonts in this environment; does not establish a compilation defect in application logic |
| Backend Jest | Both tests failed with local socket `EACCES`; importing the server also opened MongoDB DNS handles |
| JavaScript syntax | Nine inline script blocks parsed successfully; backend source and root JS files passed `node --check` |
| Static HTML IDs | 30 distinct duplicated IDs, including three series-detail pages and three comic-reader pages |
| CSS complexity | 1,300 `!important` declarations in `vibe-code.css`; 470 inline style attributes and 284 inline click handlers in `index.html` |
| Browser review | Local preview timed out; no screenshot-based visual claims made |

## Fix first: security and core reading

Priority: P0 = security boundary failure; P1 = broken core flow/data loss; P2 = significant quality/reliability problem.

| ID | Priority | Evidence | Problem and required change |
|---|---|---|---|
| 1 | P0 | `backend/src/routes/chapters.js`, GET `/:id`; `chapterController.getChapterById` | The route uses `optionalAuth`, and the controller returns any matching chapter including pages without checking visibility. Anonymous callers with an ID can retrieve draft/private/scheduled content. Require admin authentication for this admin endpoint or apply public visibility and parent-series checks. |
| 2 | P1 | `index.html:3806`, `shelfSeriesCard`; `backend/src/models/Series.js:40` | API ratings allow 0–10, but star generation uses `'☆'.repeat(5 - Math.round(rating))`. A rating such as 8 causes `RangeError`, interrupting card rendering. Normalize to five stars, clamp safely, and label the numeric scale. |
| 3 | P1 | `admin-api.js:1219` | Chapter loading hardcodes `http://localhost:5000`. In deployment this points at the reader's own computer and can be blocked as mixed content. Use the configured API base everywhere. |
| 4 | P1 | `admin-api.js:1227`; `chapterController.listChapters`; `index.html:4003` | The chapter list excludes `pages`, while the client maps those absent pages into `images`. The original reader then uses local `CHAPTER_TEXT` or placeholder comic images. Fetch the selected chapter's actual page payload and render it in one reader implementation. Handle no chapters and failed requests explicitly. |
| 5 | P1 | `index.html:5421`, `5580`, `5692`; reader pages at `5485`, `5645`, `5757` | Duplicate page and control IDs make `getElementById` target the first copy while other copies remain stale. Remove duplicated screen markup and styles; keep one instance of each screen. Add a duplicate-ID verification check. |
| 6 | P1 | `backend/src/routes/users.js`, POST `/reading-progress` | The code updates an existing entry and then unconditionally `$addToSet`s a whole progress object. Equality is across the whole object, not just series ID, so changed/defaulted fields can produce multiple entries per series. Store one atomic progress record per user/series and validate IDs, page bounds, and chapter ownership. |
| 7 | P1 | `user-api.js:117`, `:370`; `index.html:3769`, `:4041` | Client treats progress as percent, backend calls the field `page`, and several paths still index by `b.id` although lean API objects provide `_id`. Resume state, progress bars, and statistics can disagree. Define separate page, chapter, and completion fields and one normalized series ID. |
| 8 | P1 | `user-api.js`, automatic session restoration; `index.html:3488` | Restore loads the API profile then calls `startSession(email)`, which reads `USERS[email]` without ensuring it exists and overwrites freshly loaded state with cached fields. A token without a matching local user can crash. Initialize from the server profile through a single session store. |
| 9 | P1 | `user-api.js`, admin login and automatic restoration; `routes/users.js` | An admin token is also saved as the user token. Restoration requests `/users/profile`, which looks in the User collection even for Admin identities; null profile handling can then fail. Restore through `/auth/me` and dispatch by authenticated account type. |
| 10 | P1 | `user-api.js`, `admin-api.js`, API wrappers | Access tokens expire, but returned refresh tokens are discarded and no refresh flow exists. Readers are forced back to login. Implement refresh, a single retry, and consistent expiration handling. |
| 11 | P1 | `index.html:3428`, `:3459`; `docker-compose.yml` | Legacy local authentication stores plaintext passwords and creates a fixed demo admin; compose includes fixed development credentials/secrets. These are not proof of a backend auth bypass, but must be removed from release paths. Keep one server authentication implementation and provide secrets through deployment configuration. |
| 12 | P1 | `index.html:3775`, `:3814`, `:4020`; dynamic admin templates | Database content is interpolated into HTML and attributes without contextual escaping. Titles/authors/URLs can create stored HTML injection paths. Render plain values with `textContent`, validate URL schemes, and sanitize intentionally supported rich text. Reproduce with controlled fixtures before release. |

## Additional backend and integration problems

| ID | Priority | Evidence | Required change |
|---|---|---|---|
| 13 | P1 | `uploadController.uploadPages`; `uploadService.uploadChapterPages` | Every upload batch starts page order at 1; appending sets `pageCount` to the new batch length rather than total pages. Compute append offsets and total count atomically; validate target chapter and series before uploading. |
| 14 | P1 | `uploadService.replaceFile`; `uploadController.replaceFile` | Replacement deletes the old file before the new upload succeeds. The controller also does not rewrite series/chapter references to the replacement URL. Upload first, switch references, then clean up with recovery on failure. |
| 15 | P1 | `uploadController.uploadPages`; multer memory storage | Archives are fully expanded into RAM without decompressed byte/count limits. Direct uploads allow up to 150 files at the configured per-file limit. Add aggregate limits, archive expansion limits, file signature checks, and bounded processing. |
| 16 | P1 | `backend/src/routes/admin.js`, `adminController.updateUser/deleteUser/bulkUpdateSeries`; settings route | Several actions only require an admin identity and do not enforce the permissions declared in the Admin model. An editor with `manageUsers: false` can reach user management handlers. Enforce the corresponding permission for each operation and test denied roles. |
| 17 | P2 | `authController.refresh`; `routes/users.js` change-password | Refresh does not reject inactive accounts; a cleared refresh hash also needs an explicit rejection rather than a bcrypt error. Password changes do not revoke refresh sessions. Define revocation behavior and enforce it consistently. |
| 18 | P2 | `user-api.js`, `saveSessionData` and `goToLogin` | Background saves ignore HTTP failure statuses; logout clears local tokens without calling the revocation endpoint. Check results, expose sync state, and revoke the server refresh token on logout. |
| 19 | P2 | `authController.register`; `routes/settings.js`; chapter routes | Settings such as registration allowed, guest reading, and email verification are stored but not enforced by the corresponding handlers. Make advertised settings affect server behavior. |
| 20 | P2 | `user-api.js`, `/series?limit=100`; `seriesController.listSeries` | Client requests 100 series but the API caps at 50, with no follow-up pagination in this load path. Chapter request asks for 150 while API caps at 100. Follow returned pagination and paginate catalog/search/chapter lists intentionally. |
| 21 | P2 | `backend/src/server.js:34`, `config/db.js`; health tests | Importing the Express app starts DB connections and eventually crons. HTTP listening also occurs separately from successful initialization. Separate app construction from startup; add readiness and clean shutdown of DB/jobs. Unit tests must not depend on external DB startup. |
| 22 | P2 | `server.js`, CORS configuration; `middleware/auth.js` | Missing client configuration allows arbitrary origins, including `null`; DEV_MODE can bypass admin authentication outside production. Fail closed for deployments and isolate development shortcuts. |
| 23 | P2 | `sw.js`, same-origin GET handler | The service worker caches every successful same-origin GET, including authenticated API responses, keyed by request URL without an explicit account boundary. Exclude private/API requests or use intentional account-scoped caching and logout cleanup. |
| 24 | P2 | `sw.js`, navigation fallback and install assets | `caches.match('./index.html') || caches.match('./')` tests the first Promise, so the second fallback never executes. Await the first result. `user-api.js` is absent from the precache list; include all required offline assets and verify offline cold starts. |
| 25 | P2 | `index.html`, session streak date handling | UTC ISO dates drive daily streaks while local dates drive other stats. In Bangladesh, this shifts the day boundary by six hours. Use one explicit user timezone for daily metrics. |
| 26 | P2 | `frontend/src/app/page.js`, `layout.js`; repository root | Running the Next.js frontend serves a generic starter with Create Next App metadata. Choose and document the supported app entry point, deployment, static hosting, and API routing. Move unrelated experiments and temporary scripts out of the production source tree. |

## UI, UX, accessibility, and color

These are source-supported findings and design recommendations; final layout decisions require rendering at desktop, tablet, and mobile widths.

### Color system

The visual inconsistency is structural: `--vb-*` tokens define steel blue, dark theme `--accent-*` defines orange, light switches to indigo, and later CSS adds another blue theme pass. Inline admin markup also hardcodes dark backgrounds and white text. A theme switch changes the brand identity and some components cannot adapt correctly.

Calculated contrast examples from declared token pairs (not a full computed-style audit):

| Foreground / background | Ratio | Implication |
|---|---:|---|
| Dark muted `#626A7F` / `#090A0F` | 3.66:1 | Too weak for normal small text |
| Light muted `#94A3B8` / white | 2.56:1 | Too weak for normal small text |
| White / orange `#FF5A1F` | 3.12:1 | Small primary-button text lacks contrast |
| White / coral gradient endpoint `#FF7C47` | 2.55:1 | Contrast gets worse across the gradient |

Use at least 4.5:1 for normal text and 3:1 for large text; check meaningful control outlines and focus indicators as well. Transparent layers and image overlays require testing over actual composited backgrounds.

Suggested direction: retain a restrained warm-orange brand for reading actions and neutral slate surfaces. Artwork supplies most of the color. This is a design proposal, not an applied change.

| Role | Dark | Light |
|---|---|---|
| Page background | `#0B0F17` | `#F8FAFC` |
| Card surface | `#121722` | `#FFFFFF` |
| Elevated surface | `#1B2332` | `#EEF2F6` |
| Primary text | `#F8FAFC` | `#111827` |
| Secondary text | `#A7B0C0` | `#475569` |
| Muted text | `#9AA6B8` | `#64748B` |
| Primary button fill | `#C2410C` | `#C2410C` |
| Primary button text | `#F8FAFC` | `#F8FAFC` |
| Accent links / active text | `#FDBA74` | `#9A3412` |
| Focus ring | `#FDBA74` | `#9A3412` |
| Success text | `#6EE7B7` | `#166534` |
| Error text | `#FDA4AF` | `#B91C1C` |

The proposed primary button pairing is approximately 4.95:1. Verify every component/state after adoption. Use dedicated control-border tokens rather than assuming a subtle card divider is a sufficient input boundary. Keep success/error colors semantic, accompanied by text or icons.

### Specific UX improvements

1. **Make visible promises real (P1).** The Google button calls `doLogin()` rather than OAuth. `doRecoverPassword()` only shows a success toast and does not send email. Implement these flows or remove them until available. Do not show success for unsent mail.
2. **Remove demo identity and counts (P2).** Login inputs contain a demo email/password, the account label says Premium Reader, and library/wishlist badges contain fixed counts. Derive identity, status, and counts from actual account data; empty inputs should be empty.
3. **Make Home reading-led (P2).** Show the most recently read title, an explicit Resume chapter action, latest updates, and discovery. `renderCR()` currently chooses `MANGA_SERIES[0]`, not the most recently read series. Keep statistics on the statistics screen.
4. **Simplify navigation (P2).** Keep Home, Explore, Library, and More as the principal mobile destinations. Place Wishlist in Library and Trending within Explore if usage supports that choice. Remove or visibly disable Book Clubs, Challenges, Notes, and Reading Log until implemented; current controls only emit Coming soon.
5. **Use real links and buttons (P1 accessibility).** Desktop navigation, cards, close controls, dropdown actions, and tabs frequently use clickable divs. Replace with semantic controls; implement keyboard activation, tab states, current-page indication, and accessible names for icon-only controls.
6. **Fix overlay accessibility (P2).** Add appropriate dialog semantics, focus trapping, focus restoration, background inertness, and Escape handling consistently. A search overlay has `role="dialog"`, but this does not by itself establish correct dialog behavior across the app.
7. **Increase useful text sizes (P2).** CSS sets many labels and metadata to 9–11.5px and card titles to 12.5px. Use roughly 14–16px for ordinary UI text and 12–14px for secondary metadata; check Bengali glyphs, line height, long titles, and 200% zoom. Add a Bengali-capable font and explicit language handling for Bengali content.
8. **Reserve prominence for one action (P2).** Keep Read/Resume as the dominant filled button; use quiet secondary treatments for bookmark/share/library. Reduce decorative gradients, glass blur, shadows, and accent colors competing with book covers.
9. **Make feedback local and actionable (P2).** API wrappers show a full-screen loader for ordinary requests and independently hide it during concurrent work. Use section skeletons, button pending states, upload progress, retry controls, and a shared pending-request counter where global blocking is genuinely needed.
10. **Do not treat every JS exception as a total failure (P2).** `window.onerror` creates a full-screen recovery boundary even for isolated rendering errors; Reset & Fix clears all local/session storage. Recover per section, preserve user data, and explain the scope of any explicit reset.
11. **Improve forms (P2).** Use actual forms with submit handling, autocomplete, inline field errors, pending/disabled submission, and preserved input. User API code trims passwords, changing valid leading/trailing whitespace; submit passwords exactly as entered. Display name must be separate from ASCII-only username: deriving username directly from a Bengali full name currently fails backend validation.
12. **Build honest empty/error/offline states (P2).** Distinguish no chapters, no results, server failure, offline cached data, and sync pending. Never silently replace unavailable chapter content with mock pages.
13. **Respect motion and device resources (P2).** No `prefers-reduced-motion` handling was found in the main page/theme stylesheet. Add it for smooth scrolling, confetti, ripples, and animations; reduce broad `will-change`/GPU promotion and large blur effects, then profile on lower-end Android hardware.
14. **Design the reader around continuity (P1/P2).** Fetch real pages, reserve image dimensions, retry individual failures, preload modestly, offer fit-width and reading direction, preserve the exact chapter/page, and make next/previous controls truly disabled at boundaries. Ensure controls stay above safe areas and do not cover content.
15. **Consolidate CSS (P2).** Replace the override layers and inline colors with semantic tokens and reusable components. Keep dark/light variants of the same identity first; validate additional themes only after the base pair passes. Avoid adding a further override sheet.

## Recommended implementation order

1. Close anonymous chapter access and missing admin permission checks; remove release-path demo auth and unsafe HTML rendering.
2. Fix the rating crash, unique screen IDs, production API URLs, chapter loading, and empty reader handling.
3. Define API/client contracts for identity, ratings, reading progress, preferences, pagination, and session restoration; implement refresh and reliable save feedback.
4. Correct upload append/replacement behavior, startup/test isolation, and private/offline cache handling.
5. Establish one color/token system, one navigation model, accessible components, and truthful form/empty/error states.
6. Verify real user journeys at 360/390px mobile, tablet, and desktop widths, light/dark mode, keyboard-only operation, 200% zoom, Bengali/long titles, slow/offline network, empty catalogs, ratings above five, and multiple upload batches.

Acceptance should include authorization tests for private chapters and restricted admins; progress updates that leave exactly one record per series; real chapter images rendered from the API; refresh/restore without local cached users; and screenshots plus contrast checks for every interactive state. The existing two health tests do not cover these behaviors.
