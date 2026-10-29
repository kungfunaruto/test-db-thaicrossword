// Tests the Excel import function (migration 8) on PGlite with Supabase-style roles.
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
const imp = (list, date = '2026-11-01') => rows('select public.admin_import_athletes($1::jsonb, $2::date) r', [JSON.stringify(list), date]).then(r => r[0].r);
const hist = id => rows(`select game_type, rating_value::float v, effective_date::text d, source_type from public.athlete_rating_history where athlete_id=$1 order by created_at`, [id]);

let s1, ids;
await t('creates new athletes with ratings (games added automatically)', () => admin(async () => {
  s1 = await imp([{ row: 2, full_name: 'สมชาย ใจดี', full_name_en: 'Somchai Jaidee', ratings: { crossword: 1500, a_math: 1400 } },
    { row: 3, full_name: 'สมหญิง เก่ง', full_name_en: 'Somying Keng', status: 'archived', ratings: { crossword: 1600, a_math: null } }]);
  ids = Object.fromEntries((await rows('select id, full_name, games, publication_status from public.athletes')).map(r => [r.full_name, r]));
  return s1.created === 2 && s1.ratings_added === 3 && [...ids['สมชาย ใจดี'].games].sort().join() === 'a_math,crossword' && ids['สมหญิง เก่ง'].games.join() === 'crossword' && ids['สมหญิง เก่ง'].publication_status === 'archived'; }));
await t('history rows use the chosen date and source csv_import', () => admin(async () => { const h = await hist(ids['สมชาย ใจดี'].id); return h.length === 2 && h.every(x => x.d === '2026-11-01' && x.source_type === 'csv_import'); }));
await t('re-importing the same values changes nothing', () => admin(async () => {
  const r = await imp([{ row: 2, id: ids['สมชาย ใจดี'].id, full_name: 'สมชาย ใจดี', full_name_en: 'Somchai Jaidee', status: 'published', ratings: { crossword: 1500, a_math: 1400 } }]);
  return r.updated === 0 && r.unchanged === 1 && r.ratings_added === 0 && (await hist(ids['สมชาย ใจดี'].id)).length === 2; }));
await t('changed rating appends history; empty cells keep values', () => admin(async () => {
  const r = await imp([{ row: 2, id: ids['สมชาย ใจดี'].id, full_name: '', full_name_en: null, ratings: { crossword: 1550, a_math: null } }], '2026-12-01');
  const a = (await rows('select full_name, full_name_en from public.athletes where id=$1', [ids['สมชาย ใจดี'].id]))[0];
  const cur = (await rows(`select rating_value::float v from public.current_ratings where athlete_id=$1 and game_type='crossword'`, [ids['สมชาย ใจดี'].id]))[0].v;
  return r.updated === 1 && r.ratings_added === 1 && a.full_name === 'สมชาย ใจดี' && a.full_name_en === 'Somchai Jaidee' && cur === 1550 && (await hist(ids['สมชาย ใจดี'].id)).length === 3; }));
await t('edits names and status by id', () => admin(async () => {
  await imp([{ row: 5, id: ids['สมหญิง เก่ง'].id, full_name: 'สมหญิง เก่งมาก', full_name_en: 'Somying Kengmak', status: 'published', ratings: {} }]);
  const a = (await rows('select full_name, full_name_en, publication_status from public.athletes where id=$1', [ids['สมหญิง เก่ง'].id]))[0];
  return a.full_name === 'สมหญิง เก่งมาก' && a.full_name_en === 'Somying Kengmak' && a.publication_status === 'published'; }));
await t('one bad row rolls back the whole file', () => admin(async () => {
  const before = (await rows('select count(*)::int n from public.athletes'))[0].n;
  const bad = await throws(() => imp([{ row: 2, full_name: 'ใหม่ หนึ่ง', full_name_en: 'New One', ratings: { crossword: 1000 } }, { row: 3, full_name: 'ใหม่ สอง', full_name_en: '', ratings: {} }]), 'ROW 3');
  return bad && (await rows('select count(*)::int n from public.athletes'))[0].n === before; }));
await t('rejects negative / non-number rating, unrated game, bad status, unknown or malformed id', () => admin(async () =>
  (await throws(() => imp([{ row: 9, id: ids['สมชาย ใจดี'].id, ratings: { crossword: -5 } }]), 'negative'))
  && (await throws(() => imp([{ row: 9, id: ids['สมชาย ใจดี'].id, ratings: { crossword: '12a' } }]), 'number'))
  && (await throws(() => imp([{ row: 9, id: ids['สมชาย ใจดี'].id, ratings: { sudoku: 10 } }]), 'no ratings'))
  && (await throws(() => imp([{ row: 9, id: ids['สมชาย ใจดี'].id, status: 'draft' }]), 'status'))
  && (await throws(() => imp([{ row: 9, id: '11111111-1111-4111-8111-111111111111' }]), 'not found'))
  && (await throws(() => imp([{ row: 9, id: 'abc' }]), 'invalid athlete id'))));
await t('ranking view shows imported athletes', () => anon(async () => (await rows(`select full_name, rank from public.national_rankings where game_type='crossword' order by rank`)).map(r => r.full_name).join() === 'สมหญิง เก่งมาก,สมชาย ใจดี'));
await t('anon and non-admin cannot import', async () => (await anon(() => throws(() => imp([])))) && (await user(() => throws(() => imp([]), 'forbidden'))));
await t('date required; row limit', () => admin(async () => (await throws(() => imp([], null), 'date')) && (await throws(() => imp(Array.from({ length: 5001 }, () => ({}))), '5000'))));
console.log(`import: ${pass} passed, ${failed.length} failed`); failed.forEach(f => console.log(' FAIL:', f));
if (failed.length) process.exit(1);
