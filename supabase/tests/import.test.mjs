// Tests rating import + undo (migration 8) on PGlite with Supabase-style roles.
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import { fileURLToPath } from 'url';
const dir = fileURLToPath(new URL('../migrations/', import.meta.url));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
const db = new PGlite();
await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
 create table auth.users (id uuid primary key default gen_random_uuid(), email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 create schema storage; create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
 create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text); alter table storage.objects enable row level security;
 grant usage on schema public, auth, storage to anon, authenticated;
 alter default privileges in schema public grant all on tables to anon, authenticated;
 alter default privileges in schema public grant execute on functions to anon, authenticated;`);
for (const f of files) { try { await db.exec(fs.readFileSync(dir + f, 'utf8')); } catch (e) { console.log('MIGRATION ERROR', f, e.message); process.exit(1); } }
await db.exec(fs.readFileSync(dir + files[files.length - 1], 'utf8')); // idempotent
const A = '00000000-0000-0000-0000-0000000000a1', U = '00000000-0000-0000-0000-0000000000a2';
await db.exec(`insert into auth.users(id,email) values ('${A}','a@x'),('${U}','u@x'); insert into public.admin_profiles(user_id,display_name,is_active) values ('${A}','Admin',true);`);
let pass = 0; const failed = [];
const t = async (n, fn) => { try { (await fn()) ? pass++ : failed.push(n); } catch (e) { failed.push(n + ' -> ' + e.message.split('\n')[0]); } };
const as = async (role, uid, fn) => { await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${uid ?? ''}',false);`); try { return await fn(); } finally { await db.exec('reset role'); } };
const rows = async (s, p) => (await db.query(s, p)).rows;
const throws = async (fn, msg) => { try { await fn(); return false; } catch (e) { return msg ? e.message.includes(msg) : true; } };
const admin = fn => as('authenticated', A, fn), anon = fn => as('anon', null, fn), user = fn => as('authenticated', U, fn);
const imp = (game, list, date = '2026-11-01', file = 'ratings.xlsx') => rows('select public.admin_import_ratings($1, $2::date, $3, $4::jsonb) r', [game, date, file, JSON.stringify(list)]).then(r => r[0].r);
const undo = id => rows('select public.admin_revert_rating_import($1::uuid) r', [id]).then(r => r[0].r);
const cur = (id, g) => rows(`select rating_value::float v from public.current_ratings where athlete_id=$1 and game_type=$2`, [id, g]).then(r => r[0]?.v ?? null);
const SAVE = `select public.admin_save_athlete($1::uuid,$2::text,$3::text,null,$4::text[],'published',$5::jsonb,'2026-01-01'::date) id`;

let somchai, somying, imp1, imp2, newbie;
await t('setup: two existing athletes', () => admin(async () => {
  somchai = (await rows(SAVE, [null, 'สมชาย ใจดี', 'Somchai Jaidee', '{crossword}', JSON.stringify([{ game: 'crossword', value: 1500 }])]))[0].id;
  somying = (await rows(SAVE, [null, 'สมหญิง เก่ง', 'Somying Keng', '{crossword}', JSON.stringify([{ game: 'crossword', value: 1600 }])]))[0].id;
  return !!somchai && !!somying; }));
await t('import A-Math: existing athlete gets the game + rating; new athlete created; log written', () => admin(async () => {
  imp1 = await imp('a_math', [{ row: 2, athlete_id: somchai, rating: 1400 }, { row: 3, athlete_id: null, name: 'นักกีฬา ใหม่', name_en: 'New Player', rating: 1300 }]);
  newbie = (await rows(`select id, games, created_import_id, full_name_en from public.athletes where full_name='นักกีฬา ใหม่'`))[0];
  const log = (await rows('select * from public.rating_imports where id=$1', [imp1.import_id]))[0];
  const g = (await rows('select games from public.athletes where id=$1', [somchai]))[0].games;
  return imp1.changed === 1 && imp1.created === 1 && g.includes('a_math') && (await cur(somchai, 'a_math')) === 1400 && newbie.games.join() === 'a_math' && newbie.created_import_id === imp1.import_id
    && newbie.full_name_en === 'New Player' && log.rows_total === 2 && log.ratings_changed === 1 && log.athletes_created === 1 && log.game_type === 'a_math' && log.file_name === 'ratings.xlsx'; }));
await t('import Crossword: changed + unchanged counted; history keeps the old value', () => admin(async () => {
  imp2 = await imp('crossword', [{ row: 2, athlete_id: somchai, rating: 1550 }, { row: 3, athlete_id: somying, rating: 1600 }], '2026-12-01');
  const h = await rows(`select rating_value::float v from public.athlete_rating_history where athlete_id=$1 and game_type='crossword' order by created_at`, [somchai]);
  return imp2.changed === 1 && imp2.unchanged === 1 && h.map(x => x.v).join() === '1500,1550' && (await cur(somchai, 'crossword')) === 1550; }));
await t('undo restores the previous rating and keeps the history row (archived)', () => admin(async () => {
  const r = await undo(imp2.import_id);
  const h = await rows(`select publication_status from public.athlete_rating_history where import_id=$1`, [imp2.import_id]);
  const log = (await rows('select status, reverted_at from public.rating_imports where id=$1', [imp2.import_id]))[0];
  return r.ratings_archived === 1 && (await cur(somchai, 'crossword')) === 1500 && h.length === 1 && h[0].publication_status === 'archived' && log.status === 'reverted' && log.reverted_at !== null; }));
await t('undo twice is refused', () => admin(() => throws(() => undo(imp2.import_id), 'already undone')));
await t('undoing an import archives the athletes it created', () => admin(async () => {
  const r = await undo(imp1.import_id);
  const a = (await rows('select publication_status from public.athletes where id=$1', [newbie.id]))[0];
  return r.athletes_archived === 1 && a.publication_status === 'archived' && (await cur(somchai, 'a_math')) === null
    && (await anon(() => rows(`select 1 from public.national_rankings where game_type='a_math'`))).length === 0; }));
await t('a created athlete with later ratings from another import is NOT archived on undo', () => admin(async () => {
  const i3 = await imp('crossword', [{ row: 2, athlete_id: null, name: 'คนใหม่ สาม', rating: 1000 }]);
  const id3 = (await rows(`select id from public.athletes where full_name='คนใหม่ สาม'`))[0].id;
  await imp('crossword', [{ row: 2, athlete_id: id3, rating: 1100 }]);
  const r = await undo(i3.import_id);
  return r.athletes_archived === 0 && (await rows('select publication_status from public.athletes where id=$1', [id3]))[0].publication_status === 'published' && (await cur(id3, 'crossword')) === 1100; }));
await t('one bad row rolls back everything (no log, no athlete)', () => admin(async () => {
  const before = (await rows('select (select count(*) from public.athletes)::int a, (select count(*) from public.rating_imports)::int i'))[0];
  const bad = await throws(() => imp('crossword', [{ row: 2, athlete_id: null, name: 'จะไม่ถูกบันทึก', rating: 900 }, { row: 3, athlete_id: somchai, rating: -1 }]), 'ROW 3');
  const after = (await rows('select (select count(*) from public.athletes)::int a, (select count(*) from public.rating_imports)::int i'))[0];
  return bad && after.a === before.a && after.i === before.i; }));
await t('rejects unrated game, missing name, text rating, unknown/duplicate athlete, empty file', () => admin(async () =>
  (await throws(() => imp('sudoku', [{ row: 2, athlete_id: somchai, rating: 1 }]), 'no ratings'))
  && (await throws(() => imp('crossword', [{ row: 2, athlete_id: null, name: ' ', rating: 1 }]), 'name is required'))
  && (await throws(() => imp('crossword', [{ row: 2, athlete_id: somchai, rating: '1x' }]), 'number'))
  && (await throws(() => imp('crossword', [{ row: 2, athlete_id: '11111111-1111-4111-8111-111111111111', rating: 1 }]), 'not found'))
  && (await throws(() => imp('crossword', [{ row: 2, athlete_id: somchai, rating: 1 }, { row: 3, athlete_id: somchai, rating: 2 }]), 'more than once'))
  && (await throws(() => imp('crossword', []), 'nothing to import'))));
await t('anon / non-admin cannot import, undo or read the log', async () => (await anon(() => throws(() => imp('crossword', [{ row: 2, athlete_id: somchai, rating: 1 }]))))
  && (await user(() => throws(() => imp('crossword', [{ row: 2, athlete_id: somchai, rating: 1 }]), 'forbidden'))) && (await user(() => throws(() => undo(imp1.import_id), 'forbidden')))
  && (await anon(() => throws(() => rows('select id from public.rating_imports')))) && (await user(async () => (await rows('select id from public.rating_imports')).length === 0)));
await t('public cannot see import_id / created_import_id', async () => (await anon(() => throws(() => rows('select import_id from public.athlete_rating_history'))))
  && (await anon(() => throws(() => rows('select created_import_id from public.athletes')))));
console.log(`import: ${pass} passed, ${failed.length} failed`); failed.forEach(f => console.log(' FAIL:', f));
if (failed.length) process.exit(1);
