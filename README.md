# Crossword, A-Math, Kumkom & Sudoku Association of Thailand: Website

Single source of truth for progress. Status legend: `[x]` done & verified · `[ ]` not started · `[/]` in progress · `[!]` blocked · `[?]` needs decision.

## 1. Overview & stack
React 18 + TypeScript + Vite 5 + Tailwind 3 + React Router 6; Supabase (Postgres, Auth, Storage, RLS); hosted on Vercel (one Edge Function: `api/translate.ts`).
Public site in **Thai and English** (switch in the header). Admin panel in Thai. Code/docs in English.

## 2. Structure
- `src/i18n/` `th.ts` (source) / `en.ts` (same shape): every public UI string. `useLang()` gives `{ lang, t, setLang }`; `loc(row, 'title', lang)` picks `title_en` when English is selected and filled, otherwise the Thai column. Choice is saved in `localStorage` (`tca-lang`); `?lang=en` also works.
- `src/content/` long static content: rules (`rules/*.ts` Thai, `rules/en/*.ts` English), competition formats, About (`about.ts`, `about.en.ts`).
- `src/lib/` `query.ts` (stale-while-revalidate cache + `prefetch`), `prefetch.ts` (route + data prefetch on hover), `dates.ts` (Thailand-time "today", TH/EN date formatting, Buddhist era in Thai), `translate.ts` (Thai→English machine translation), `images.ts` (resize/compress before upload), `analytics.ts` (anonymous page views), `excel.ts` (reads .xlsx/.csv, column detection, sample file; exceljs is loaded only when used), `nameMatch.ts` (name tidying + similar-name detection for imports).
- `src/services/publicService.ts` (all public reads), `adminService.ts` (auth, counts, analytics RPC).
- `src/components/` `common/` (PageHeader, SmartImage, Gallery, Lightbox, DateRangePicker, Segmented, Pagination, EditedBadge, ShareButtons, TopProgress, States…), `news/`, `events/`, `rankings/` (Avatar, Leaderboard), `rules/` (BlockView, Toc, FormatsBlock, ToolBlocks, WordChecker), `layout/MainLayout.tsx`.
- `src/pages/` public pages (every page except Home is lazy-loaded) and `pages/admin/` (ResourceManager + `resources.tsx` configs for news / competitions / Q&A, AthletesAdminPage, QaAdminPage with visitor-question inbox, AdminDashboardPage + `charts.tsx`).
- `api/translate.ts` Vercel Edge Function (admin-only proxy to Google Translate); `api/_gtranslate.ts` shared with the Vite dev server.
- `public/logo/` `tca-logo-original.webp` (emblem supplied 30 Oct 2026, untouched) and files generated from it: `tca-logo.png/.webp` (transparent, full size), `tca-logo-256.png/.webp` (used on the site), `favicon-64.png`, `apple-touch-icon.png` (white background for iOS), `tca-logo.jpg` (on white, kept for old links). Regenerate all of them whenever the emblem changes.

## 3. Setup
```
npm install
cp .env.example .env     # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (anon key only; never service_role)
npm run dev | npm run build | npm run test:db
```
First admin: create a user in Supabase → Authentication, then `insert into public.admin_profiles (user_id, display_name) values ('<uuid>', '<name>');`.

## 4. Going live with v2 (do in this order)
1. **Supabase SQL editor:** run `supabase/migrations/20261029000001_v2_bilingual_galleries_analytics.sql` (after migrations 1–6). It is safe to run twice. It converts existing data:
   Then run `supabase/migrations/20261030000001_athlete_excel_import.sql` (first import version, already run on 30 Oct), `20261031000001_rating_import_log_and_undo.sql` (current import + undo) `20261031000002_athlete_english_name_optional.sql` (athlete English name optional) and `20261031000003_event_organizer.sql` (competition organiser; English translation columns never count as edits).
   news categories → `general` / `competition` (old "ผลการแข่งขัน" → competition, others → general); news/events `archived` → `draft`; events `game_type` → `games[]` (`multiple` → all four games); athletes `draft` or inactive → `archived`; FAQ `draft` → `archived`; first image → `images[]`.
2. **Deploy the new code right after** (the old deployed site does not understand the new statuses/columns).
3. Vercel env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must exist (the translate function reuses them).
4. In `/admin/news`, `/admin/events`, `/admin/qa`: the button **"แปลอังกฤษที่ยังขาด"** fills English for existing items. In `/admin/rankings`, add the English name of each existing athlete (required on next save).

## 5. Auth & security design
- `public.is_admin()` (SECURITY DEFINER, fixed search_path) reads `admin_profiles`; never `user_metadata`. RLS on every table; public reads only published rows; writes admin-only.
- Public column allow-lists (`anon` grants): never `created_by`, `edit_note`, comments, or analytics.
- `athlete_comments` (private notes): admin-only RLS, no anon grants. `faq_submissions`: visitors may INSERT the `question` column only, never read; flood guard 30 per 10 minutes site-wide. `page_views`: visitors INSERT only; admins read through `admin_analytics()`.
- `athlete_rating_history` stays append-only (no DELETE policy; facts immutable).
- `api/translate` checks the caller's Supabase session with `is_admin()` before translating.
- Frontend route guard is UX only; the database is the security boundary.

## 6. Features (v2, 29 Oct 2026)
- **Brand/UI:** transparent logo; new design system (IBM Plex Sans Thai + Kanit, navy/gold/orange from the emblem, rounded cards, floating game-tile hero decoration); animations: page fade, staggered cards, skeleton loaders, top progress bar, sliding segmented controls, animated date picker, lightbox, toasts. `prefers-reduced-motion` disables all motion.
- **Home:** quick links and footer quick menu removed; news + competitions rows (competitions: pinned first, then newest *added*); whole cards are links; **Top 10 ratings** for Crossword and A-Math (podium + list, photos, default avatar); game cards link to the rules pages.
- **News / Competitions lists:** search, category or status pills, **date-range picker** (presets + calendar; bottom sheet on phones), no sort menu, 15 per page with numbered pagination; filters live in the URL. Fixed-height cards (2-line title/excerpt clamp). Tall posters are shown whole over a blurred copy (`SmartImage`); multiple images show a photo-count badge.
- **Competition status** is computed from dates in Thailand time. With a registration deadline: open (≤ deadline) → registration closed (≤ last competition day) → ended. The deadline is optional: competitions that do not take registrations show "เร็ว ๆ นี้ / Upcoming" until the last competition day, then ended. Filters run in SQL on `registration_deadline` / `last_date` (the generated `reg_close` column is no longer used).
- **Competition cards:** the badge on the image shows the competition days ("11 พ.ย.", "20–21 พ.ย.", "29 พ.ย. – 2 ธ.ค."); the line under the title shows the organiser (new admin field "ผู้จัดการแข่งขัน", Thai + auto-translated English); phones keep a date line because their thumbnail has no badge.
- **Notifications (admin):** shown at the top centre (below the phone top bar), above every dialog, so they never cover the Save/action buttons. The "Last edited" history popup is rendered at the top layer (portal, fixed) so page content can never cover it, and flips above the badge near the bottom of the screen.
- **List order:** News: pinned first (most recently pinned first), then most recently added (`created_at`). Competitions: pinned first, then by first competition day (latest first).
- **Detail pages:** gallery + full-screen viewer (swipe/keyboard), info sidebar (registration countdown), documents, share (Facebook/LINE/copy), related news, **"Last edited <date>"** badge showing the full history on hover (popup on touch screens).
- **Edit history:** changing a *published* news item or competition requires an "what changed" note (enforced by a database trigger; stored in `content_revisions`; auto-translated). Pin/status/translation-only changes need no note; draft edits are not recorded.
- **Games & Rules:** competition formats moved to the end of `/games`; rules pages have a sticky table of contents with scroll highlighting and reading progress (chip bar on phones).
- **Rankings:** school/province removed; athlete photos with default avatar; podium for the top 3; Thai/English names.
- **Q&A:** visitors can send a question (question only, no personal data; honeypot + 30-second client throttle + DB flood guard).
- **Admin:** slide-over forms; multi-image upload (drag & drop, reorder, first = cover, resized to ≤2000px WebP in the browser); "บันทึก/บันทึกฉบับร่าง" buttons instead of a status menu; news categories general/competition; competitions: multi-select games, registration deadline required, no activity type, computed status; English tab with auto-translation on save (only for empty fields or when the Thai changed and the English was not edited by hand) and per-field re-translate; athletes: photo, Thai name (required) and English name (optional; the Thai name is shown when it is empty), published/archived, private comments; Q&A: published/archived, newest first, **visitor-question inbox** ("ตอบ" opens a pre-filled Q&A form and marks the question answered; unread count badge in the sidebar).
- **Rating import from Excel (with undo):** `/admin/rankings` → "นำเข้าเรตติ้งจาก Excel". Pick the game (Crossword or A-Math) and the effective date, drop an .xlsx/.csv with only a name column and a rating column (names may be Thai or English; columns are detected from the header and can be changed). The file is read in the browser and never stored. Each name is compared with BOTH the Thai and the English name of every athlete after tidying (titles like นาย/ด.ช., spaces, upper/lower case), and the confirm page says which one matched ("ตรงกับชื่อไทย" / "ตรงกับชื่ออังกฤษ"); a surname-first English name is offered for review. The confirm page lists rating changes (old → new, +/−), new athletes, unchanged, skipped rows (no name, not a number, duplicate in file), and **names that look like an existing athlete** (typo/tone-mark check): the admin must choose "same person", "new athlete" or "skip" before confirming, so misspellings do not create duplicates. Saved by `admin_import_ratings` in one transaction; every import is logged in `rating_imports`; ratings are only added (history kept). The "ประวัติการนำเข้า / ย้อนกลับ" tab can **undo** an import: its ratings are archived (previous ratings become current again) and athletes it created are archived.
- **Dashboard:** 4 totals (news, competitions, athletes, Q&A) + visitor analytics: online now, visitors today / this month / all time, daily visitors & page views (7/30/90 days, with table view), top pages, top news, top competitions, busiest hours (Thailand time), devices, language, referrers, new visitors, pages per visit. Auto-refresh every minute.
- **Speed:** per-page code splitting (first load ~141 KB gzip, was one 604 KB bundle), page data cached and shown instantly when revisiting, code + data prefetched when hovering a link, list queries fetch card columns only, `preconnect` to Supabase, skeletons instead of blank spinners, uploads compressed, long cache headers for `/assets`.

## 7. Testing
- `npm run test:db`: runs migrations on PGlite with Supabase-style roles. `db.test.mjs 6` (migrations 1–6, 72 tests) + `v2.test.mjs` (old-shape data → migration 7 twice → mapping, RLS, grants, edit-note trigger, computed status, athlete RPC, comments, submissions + flood guard, analytics RPC; 40 tests) + `import.test.mjs` (rating import per game, log, undo restores previous ratings and archives created athletes, all-or-nothing rollback, validation, permissions; 11 tests). Latest: 124 passed, 0 failed.
- Rating import verified in headless Chromium against the mock API with a file containing a title prefix, an English name, two typos, a new name, an unchanged rating, a text rating, a duplicate row and a rank column: correct columns detected, typos sent to review, confirm blocked until resolved, import saved, history shown, undo restored every previous rating.
- UI verified in Chromium against a local mock of the Supabase API (desktop 1280px, tablet 800px, phone 390px; Thai and English; admin login, forms, edit-note enforcement, inbox answer flow): no console errors.
- **Not yet tested against the real Supabase project** (migration 7 must be run there first) and the Vercel `api/translate` function has not been deployed/tested.

## 8. Known limitations / open items
- [!] **Machine translation** uses Google Translate's free web endpoint (as requested). During development it returned HTTP 429 (rate-limited) from this machine, so auto-translation could not be confirmed end-to-end. If it fails, admins see a notice and can type English by hand; the public English page falls back to Thai. Switching to an official API later only touches `src/lib/translate.ts` and `api/_gtranslate.ts`.
- [?] English translations of the rules and About page were written by hand from the Thai text; the association should review them. The Thai PDF remains the official rules.
- [?] Uploaded images that are removed from a form stay in Storage (no automatic cleanup).
- [?] A-Math equation squares, Kumkom = Thaismith PDF, About-page pending items, official rating formula: unchanged from before (see git history).
- [ ] Windows `ThaiWordChallenge.exe` still not built (see `tools/kumkom-challenge/README.md`); Sudoku rules page.
- [?] `npm audit`: exceljs 4.4.0 pulls an old `uuid` (moderate; only affects a code path the site does not use). Older findings for react-router and zod predate this work.

## 9. How to resume
1. Read this README. 2. `git status`. 3. `npm run build && npm run test:db`. 4. Continue from §4 / §8. If repo and README disagree, the repo wins; fix the README.
