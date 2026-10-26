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
Public: `/`, `/news`, `/news/:id`, `/events`, `/events/:id`, `/rankings` (`?game=crossword|a_math`), `/games`, `/games/crossword`, `/games/a-math`, `/games/kumkom`, `/qa`; placeholder: `/about`. Admin (guarded): `/admin/login`, `/admin`, `/admin/news`, `/admin/events`, `/admin/rankings`, `/admin/qa`.

## 6. Status
- [x] `npm run build` (tsc + vite) passes; layout checked in a headless browser at 1280px and 390px (without database data)
- Migrations, run IN ORDER: `20261023000001_initial_schema.sql`, `20261024000001_fix_triggers_and_rankings.sql`, `20261025000001_athlete_games_and_labels.sql`, `20261026000001_ranked_games_and_hardening.sql`
- [x] **Database audit**: `npm run test:db` runs all migrations on a real Postgres (PGlite) with Supabase-style roles (anon / authenticated / admin / inactive admin) and checks RLS, grants, triggers, constraints, the ranking view and the save RPC. Latest run: 54 passed, 0 failed. It is a local emulation, so it does NOT replace testing on the real Supabase project (storage upload policies and PostgREST behaviour are not covered).
- Ranked games: only Crossword and A-Math have ratings (`game_types.has_rating`, enforced by triggers and the RPC). Sudoku and Kumkom stay valid for events only. To enable another game later, set its `has_rating = true` and add it to `RANKED_GAMES` in `src/utils/labels.ts`.
- Hardening in migration 4: removed unused `athletes.admin_notes`; public (anon) API can read only an allow-list of columns on news, events, rating history (no `created_by`, notes, source); `hall_of_fame` is no longer publicly readable; ratings of inactive athletes are not public.
- Spelling: A-Math is written เอแม็ท, Kumkom is คำคม (labels in code and `game_types`).
- Line breaks: เอแม็ท and ซูโดกุ never split across lines (`nb()` in `src/utils/labels.ts` inserts invisible word joiners between syllables; applied to labels, page titles, and news/event text). Copy-pasted text may contain these invisible characters.
- Mobile (<1024px): no white top bar; a navy bar with logo + hamburger. The 4 quick-link cards on Home are hidden below 640px.
- [/] Admin rankings: athlete form with games (multi-select) and a rating per game; edit name/school/province/games/ratings; history with hide/publish. Saving uses the atomic RPC `admin_save_athlete` (admin-checked in SQL). **Not yet tested against Supabase.**
- Rating rule (provisional, needs association confirmation): current rating = published record with latest effective_date, then latest created_at (`current_ratings` view). Equal ratings share a rank. Un-selecting a game removes the athlete from that game's ranking; the history is kept.
- Athlete code and display name are no longer in the form (columns remain in the database).
- Thai typography: `tailwind.config.js` sets taller line-heights; for headings/hero copy use `src/components/common/Th.tsx` to control where lines may break.
- [/] Public pages (Home, News, Events, Rankings) restyled; About and Games/Rules are placeholders awaiting verified content
- [x] **Rules pages** (`/games`, `/games/{crossword,a-math,kumkom}`): content lives in `src/content/rules/*.ts` (separate from UI, rendered by `src/components/rules/RulesView.tsx`); full PDFs in `public/rules/` are shown at the bottom of each page (download, open, desktop preview). Content is a summary of the Bangkok Crossword Club PDFs (Crossword = Wordsmith Ver.16/6/2026, A-Math = Mathsmith Ver.4/2025, Kumkom = Thaismith Ver.1/6/2026). To change a rule, edit the matching file; to replace a PDF, overwrite the file in `public/rules/` and update `version` in the content file.
- [x] **Q&A**: public `/qa` (accordion, search, game filter) and admin `/admin/qa` (add/edit/delete, order, publish). Migration `20261027000001_faqs.sql`. Database tests: 62 passed.
- [?] Needs confirmation by the association: (1) A-Math yellow/red "Equation" squares are shown as multiplying the WHOLE equation (the PDF's equipment list words them like piece squares, but its blank-tile rule says whole equation); (2) Kumkom = "Thaismith" PDF; (3) the Crossword PDF file name says "3_2025" but its cover says Ver.16/6/2026 (cover version is shown); (4) the PDF end-game worked examples are not reproduced (numbers unreadable in text extraction); the page points to the PDF.
- [ ] Rich text editor; upload progress; CSV import/export; duplicate-athlete resolution; athlete public profile; ranking categories; RLS tests; automated tests

## 7. Blockers / decisions
- [!] Supabase project URL + anon key (needed to test anything against a database)
- [?] Official logo, English name, history/vision/mission, contact, social accounts, rules text/documents
- [?] Official rating formula, "current rating" rule, tie-breaking, ranking category definitions. Not implemented; no `current rating` view exists yet
- [?] Event status precedence if auto-calculated statuses are wanted. Currently only the stored admin value would be shown
- [?] Whether Hall of Fame should show linked event title live or the snapshot `event_name` (trigger currently snapshots on insert)

## 8. Known limitations
No tests exist. No CSV tooling yet. Rating "current value" logic not implemented. Bundle not code-split.

## 9. Next tasks (in order)
1. Run migration `20261027000001_faqs.sql`; add a few Q&A in `/admin/qa` and check `/qa`.
2. Have the association proofread the 3 rules pages against the PDFs (see [?] items above).
3. About page content; CSV import/export; rating rule confirmation; RLS tests on the real Supabase project.

## 10. How to Resume Development
1. Read this whole README. 2. Inspect the repo and `git status`. 3. Compare code to this file. 4. Verify claimed statuses (run `npm run build`). 5. Continue from the first unfinished task above. 6. Preserve existing work; don't recreate it. 7. Update this README after the next verified milestone. 8. Run relevant tests/builds. 9. Report blockers honestly. If repo and README disagree, the repo wins; fix the README.
# 1
