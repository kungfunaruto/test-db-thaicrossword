# Crossword, A-Math, Kumkom & Sudoku Association of Thailand: Website

Single source of truth for progress. Status legend: `[x]` done & verified · `[ ]` not started · `[/]` in progress · `[!]` blocked · `[?]` needs decision.

## 1. Overview & stack
React + TypeScript + Vite + Tailwind 3 + React Router; Supabase (Postgres, Auth, Storage, RLS). Public UI in Thai, code/docs in English.

## 2. Structure (current)
- `src/config/site.ts`: association name, nav, placeholders for logo/contact/social (unverified values are `null`)
- `src/services/` `supabase.ts` (client, env check), `newsService.ts`, `adminService.ts` (sign in/out, `is_admin` RPC)
- `src/hooks/useAdminGuard.ts`, `src/pages/admin/{AdminLoginPage,RequireAdmin,AdminDashboardPage}.tsx`
- `src/components/layout/MainLayout.tsx` (Header, Footer, responsive nav), `src/components/common/States.tsx`
- `src/pages/HomePage.tsx` (hero + latest news from DB), `src/pages/PlaceholderPage.tsx` (all other routes)
- `supabase/migrations/20261023000001_initial_schema.sql`, `supabase/seed.sql` (intentionally empty)

## 3. Setup
```
npm install
cp .env.example .env     # fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (anon key only; never service_role)
npm run dev | npm run build
```
Database: run the migration in the Supabase SQL editor (or `supabase db push`). First admin: create a user in Dashboard → Authentication, then `insert into public.admin_profiles (user_id, display_name) values ('<uuid>', '<name>');` (see `seed.sql`). There is no public sign-up path to `admin_profiles`.

## 4. Auth & security design
- `public.is_admin()` (SECURITY DEFINER, fixed search_path) reads `admin_profiles` (active rows only); never `user_metadata`.
- RLS on all tables. Public: published rows only. Writes: admin only. `admin_profiles`: own-row read, no write grants/policies.
- `athlete_rating_history` has no DELETE policy; a trigger blocks editing athlete/game/value/date. Corrections = new row with `corrects_id` + archive the old row.
- `athletes` has no date_of_birth column by design; `admin_notes` is excluded from anon column grants.
- Frontend route guard is UX only; the database is the security boundary.
- Storage: buckets `news-images`, `event-images`, `athlete-images` (public read, admin write, 5 MB, JPEG/PNG/WebP).

## 5. Routes
Public: `/`, `/about`, `/news`, `/news/:id`, `/events`, `/events/:id`, `/rankings` (`?game=crossword|a_math`), `/games`, `/games/crossword`, `/games/a-math`, `/games/kumkom`, `/qa`.
Admin (guarded): `/admin/login`, `/admin`, `/admin/news`, `/admin/events`, `/admin/rankings`, `/admin/qa`. All 13 routes were smoke-tested at desktop and mobile widths (no JS errors, no horizontal overflow; `/admin` redirects to login when logged out).

## 6. Status
**Migrations, run IN ORDER:** `20261023000001_initial_schema` → `20261024000001_fix_triggers_and_rankings` → `20261025000001_athlete_games_and_labels` → `20261026000001_ranked_games_and_hardening` → `20261027000001_faqs` → `20261028000001_pinned_cards`.
**Database tests:** `npm run test:db` runs every migration on a real Postgres (PGlite) with Supabase-style roles and checks RLS, grants, triggers, ranking views, the save RPC, FAQs and pinning. Latest run: 72 passed, 0 failed. This is a local emulation and does NOT replace testing on the real Supabase project.

### Done in this session (built and browser-tested; NOT tested against a real Supabase project)
- **Official logo**: `public/logo/tca-logo.jpg` is the supplied file, byte-for-byte unmodified (637x535). CSS sets only `height`, `width:auto`, so the ratio is preserved (measured 1.19 = original). Used in the desktop header, the mobile bar (inside a white pill because the JPEG has a white background), the footer, the About hero and the favicon. `src/config/site.ts` now uses the name printed on the logo: "สมาคมครอสเวิร์ดเกม เอแม็ท คำคม และซูโดกุ แห่งประเทศไทย" / "Thailand Crossword Game A-Math Kumkom and Sudoku Association" (previously "ครอสเวิร์ด" without "เกม").
- **About page** (`src/pages/AboutPage.tsx`, content in `src/content/about.ts`): written only from verifiable sources (press releases 2010-2026, the association's rules PDFs, the logo); each timeline item links to its source. Unverified items (founding year, mission/vision, current officers, contact details, statistics) are shown as "pending confirmation", not as facts. The Facebook page could not be read automatically (robots disallowed): nothing is taken from it, it is only linked.
- **Crossword Challenge**: link to the official Collins tools page. **Word checker** uses ENABLE (public-domain list, 172,823 words) because Collins word lists are copyrighted and cannot be embedded; results are labelled as an unofficial reference ("QI" is not in ENABLE but is valid in Collins) and a link to Collins' CHECK page is provided. No scraping, no API. Credits: `public/dictionary/SOURCES.txt`.
- **Kumkom Challenge + checker**: the web checker uses the supplied `words.txt` (37,627 lines; 37,626 after Unicode NFC de-duplication), exact match. Windows program kit: `tools/kumkom-challenge/` (original `RBD2026.py` unchanged, `database/words.txt`, `build_windows.bat`, `.github/workflows/build-kumkom-challenge.yml`, README). Tested: the program loads 37,627 words and answers pass/fail correctly under tkinter (headless Linux); a PyInstaller build on Linux bundles `database/words.txt` and starts. **The Windows `.exe` has NOT been built or tested** (PyInstaller cannot cross-compile); until then the site shows an "in preparation" notice. To publish: build on Windows (or run the GitHub Action), copy to `public/downloads/ThaiWordChallenge.exe`, set `kumkomExe.available = true` in `src/content/rules/tools.ts`.
- **Competition formats**: all 16 formats (Green and Guelph are two related systems, shown together as in the requested list) on all three rules pages after "End game", each with how it works / pairing / example / when to use. Definitions follow John J. Chew III's tsh documentation (linked on the page); examples are illustrative. Content: `src/content/rules/formats.ts`.
- **Pinned cards**: `is_pinned` + database-managed `pinned_at` on `news` and `events` (migration 6). Admin: pin/unpin button, gold badge and row highlight, a form checkbox, and a warning when more than 5 live items are pinned. Home: one query per section (`order is_pinned desc, pinned_at desc, newest`, `limit 5`), so no duplicates and pinned items count toward the 5; news and competitions are independent. The Home competitions section now lists published events of any status (newest start date first) instead of upcoming-only, as requested; /news and /events keep their normal sorting.
- **Cards**: phone = compact horizontal cards (88px thumbnail, title, date, status/pin; whole card tappable); tablet/desktop = original vertical cards in ONE non-wrapping row (256px each) with arrow buttons plus touch/trackpad scrolling. Verified at 1280, 820 and 390 px.

### Open items
- [?] A-Math yellow/red "Equation" squares are shown as multiplying the whole equation (the PDF equipment list words them like piece squares; its blank-tile rule says whole equation). Confirm with the association.
- [?] "Kumkom" = the Thaismith PDF; the Crossword PDF file name says 3_2025 but its cover says Ver.16/6/2026.
- [?] About page pending items (above). The current-rating rule for rankings is still provisional.
- [ ] Rich text editor, upload progress bar, CSV import/export, duplicate-athlete resolution, ranking categories, athlete profile page, Sudoku rules page.

### Test files review
- Removed (disposable, regenerable): `dist/`, `tools/kumkom-challenge/__pycache__`, the scratch copy of the DB test harness and the PyInstaller trial build outside the project, one-off browser scripts/screenshots in /tmp.
- Kept on purpose: `supabase/tests/db.test.mjs`, the `test:db` script and the `@electric-sql/pglite` dev dependency. Nothing in `src/` imports them and they are not in the production bundle, but they are the only automated check of the security policies. To remove them anyway: delete `supabase/tests/`, the `test:db` script and the `@electric-sql/pglite` devDependency; the app is unaffected.
- Not test files despite their names: `supabase/seed.sql` (documents first-admin creation), `public/dictionary/*` (production data for the word checkers).

## 7. Blockers / decisions
- [!] Supabase project URL + anon key (needed to test anything against a database)
- [?] Official logo, English name, history/vision/mission, contact, social accounts, rules text/documents
- [?] Official rating formula, "current rating" rule, tie-breaking, ranking category definitions. Not implemented; no `current rating` view exists yet
- [?] Event status precedence if auto-calculated statuses are wanted. Currently only the stored admin value would be shown
- [?] Whether Hall of Fame should show linked event title live or the snapshot `event_name` (trigger currently snapshots on insert)

## 8. Known limitations
No tests against a real Supabase project; no Windows `.exe` built; the word checkers match exactly (Thai tone-mark/vowel order matters) and the English list is not the official Collins list; browser checks ran in headless Chromium only.

## 9. Next tasks (in order)
1. Run migrations 5 and 6 on Supabase; test pinning in `/admin/news` and `/admin/events`, then check the Home page.
2. Build `ThaiWordChallenge.exe` on Windows (or via GitHub Actions), test it, publish it (see `tools/kumkom-challenge/README.md`).
3. Get the About-page pending items and the [?] items confirmed by the association.
4. CSV import/export, rating-rule confirmation, RLS checks on the real project.

## 10. How to Resume Development
1. Read this whole README. 2. Inspect the repo and `git status`. 3. Compare code to this file. 4. Verify claimed statuses (run `npm run build`). 5. Continue from the first unfinished task above. 6. Preserve existing work; don't recreate it. 7. Update this README after the next verified milestone. 8. Run relevant tests/builds. 9. Report blockers honestly. If repo and README disagree, the repo wins; fix the README.
