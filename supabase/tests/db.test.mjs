import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
const upto = Number(process.argv[2] ?? 99);
const dir = new URL('../migrations/', import.meta.url).pathname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort().slice(0, upto);
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
const A = '00000000-0000-0000-0000-0000000000a1', U = '00000000-0000-0000-0000-0000000000a2', I = '00000000-0000-0000-0000-0000000000a3';
await db.exec(`insert into auth.users(id,email) values ('${A}','a@x'),('${U}','u@x'),('${I}','i@x');
 insert into public.admin_profiles(user_id,display_name,is_active) values ('${A}','Admin',true),('${I}','Old',false);`);
let pass = 0; const failed = [];
const t = async (n, fn) => { try { (await fn()) ? pass++ : failed.push(n); } catch (e) { failed.push(n + ' -> ' + e.message.split('\n')[0]); } };
const as = async (role, uid, fn) => { await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${uid ?? ''}',false);`); try { return await fn(); } finally { await db.exec('reset role'); } };
const rows = async (s, p) => (await db.query(s, p)).rows;
const throws = async fn => { try { await fn(); return false; } catch { return true; } };
const blocked = async (s, p) => { try { return (await db.query(s, p)).rows.length === 0; } catch { return true; } };
const anon = fn => as('anon', null, fn), admin = fn => as('authenticated', A, fn), user = fn => as('authenticated', U, fn), old = fn => as('authenticated', I, fn);

// ---- is_admin
await t('is_admin true for active admin', () => admin(async () => (await rows('select public.is_admin() v'))[0].v === true));
await t('is_admin false for non-admin / inactive / anon', async () => !(await user(async () => (await rows('select public.is_admin() v'))[0].v)) && !(await old(async () => (await rows('select public.is_admin() v'))[0].v)) && !(await anon(async () => (await rows('select public.is_admin() v'))[0].v)));
// ---- admin_profiles
await t('admin_profiles: anon cannot read', () => anon(() => blocked('select user_id from public.admin_profiles')));
await t('admin_profiles: non-admin sees nothing', () => user(() => blocked('select user_id from public.admin_profiles')));
await t('admin_profiles: admin sees only own row', () => admin(async () => { const r = await rows('select user_id from public.admin_profiles'); return r.length === 1 && r[0].user_id === A; }));
await t('admin_profiles: user cannot self-insert', () => user(() => blocked(`insert into public.admin_profiles(user_id) values ('${U}') returning user_id`)));
await t('admin_profiles: admin cannot edit roles/active via API', () => admin(() => blocked(`update public.admin_profiles set is_active = false returning user_id`)));
// ---- news
const N = `insert into public.news (category,title,slug,content,status,created_by) values ('ประกาศทั่วไป',$1,$2,'เนื้อหา',$3,$4) returning id`;
await t('news: anon/user/inactive admin cannot insert', async () => (await anon(() => blocked(N, ['a', 's0', 'published', null]))) && (await user(() => blocked(N, ['a', 's0', 'published', null]))) && (await old(() => blocked(N, ['a', 's0', 'published', null]))));
await t('news: admin inserts (Thai roundtrip, published_at stamped)', () => admin(async () => { await rows(N, ['ข่าวทดสอบ ครอสเวิร์ด', 'pub', 'published', A]); await rows(N, ['ร่าง', 'draft', 'draft', A]); await rows(N, ['เก็บ', 'arch', 'archived', A]);
  const r = await rows(`select title, published_at from public.news where slug='pub'`); return r[0].title === 'ข่าวทดสอบ ครอสเวิร์ด' && r[0].published_at !== null; }));
await t('news: duplicate slug rejected', () => admin(() => throws(() => rows(N, ['x', 'pub', 'draft', A]))));
const NC = 'id,image_url,category,title,slug,excerpt,content,external_url,status,published_at,created_at,updated_at';
await t('news: anon sees only published (explicit columns)', () => anon(async () => { const r = await rows(`select ${NC} from public.news`); return r.length === 1 && r[0].slug === 'pub'; }));
await t('news: anon cannot update/delete', async () => (await anon(() => blocked(`update public.news set title='x' returning id`))) && (await anon(() => blocked(`delete from public.news returning id`))));
await t('news: non-admin cannot update/delete', async () => (await user(() => blocked(`update public.news set title='x' returning id`))) && (await user(() => blocked(`delete from public.news returning id`))));
await t('news: admin * select works', () => admin(async () => (await rows('select * from public.news')).length === 3));
// ---- events
const E = (s, ed, url, slug, pub) => `insert into public.events (image_url,title,slug,category,game_type,start_date,end_date,venue,description,result_url,teacher_certificate_url,student_certificate_url,competition_status,publication_status,created_by) values (null,'งานแข่ง','${slug}','tournament','crossword','${s}',${ed},'สนาม','รายละเอียด',${url},null,null,'upcoming','${pub}','${A}') returning id`;
await t('events: admin insert works (regression: "new has no field status")', () => admin(async () => { await rows(E('2026-12-01', 'null', 'null', 'e1', 'published')); await rows(E('2026-12-01', 'null', 'null', 'e2', 'draft')); return (await rows(`select published_at from public.events where slug='e1'`))[0].published_at !== null; }));
await t('events: end < start rejected', () => admin(() => throws(() => rows(E('2026-12-05', `'2026-12-01'`, 'null', 'e3', 'draft')))));
await t('events: bad URL rejected', () => admin(() => throws(() => rows(E('2026-12-01', 'null', `'ftp://x'`, 'e4', 'draft')))));
const EC = 'id,image_url,title,slug,category,game_type,start_date,end_date,venue,description,result_url,teacher_certificate_url,student_certificate_url,competition_status,publication_status,published_at,created_at,updated_at';
await t('events: anon sees only published', () => anon(async () => (await rows(`select ${EC} from public.events`)).length === 1));
await t('events: anon/user cannot write', async () => (await anon(() => blocked(E('2026-12-01', 'null', 'null', 'z', 'published')))) && (await user(() => blocked(E('2026-12-01', 'null', 'null', 'z', 'published')))));
// ---- athletes via RPC
const SAVE = `select public.admin_save_athlete($1::uuid,$2::text,$3::text,$4::text,$5::text[],$6::text,$7::boolean,$8::jsonb,$9::date) id`;
const save = (id, name, games, ratings, o = {}) => rows(SAVE, [id, name, o.school ?? 'โรงเรียน ก', o.prov ?? 'กรุงเทพ', games, o.pub ?? 'published', o.active ?? true, JSON.stringify(ratings), o.date ?? '2026-01-10']).then(r => r[0].id);
await t('rpc: anon denied', () => anon(() => throws(() => save(null, 'x', '{crossword}', []))));
await t('rpc: non-admin / inactive admin denied', async () => (await user(() => throws(() => save(null, 'x', '{crossword}', [])))) && (await old(() => throws(() => save(null, 'x', '{crossword}', [])))));
let a1, a2, a3, a4, a5;
await t('rpc: admin creates athlete with 2 games + 2 ratings', () => admin(async () => { a1 = await save(null, 'สมชาย ใจดี', '{crossword,a_math}', [{ game: 'crossword', value: 1500 }, { game: 'a_math', value: 1400 }]);
  const g = (await rows('select games from public.athletes where id=$1', [a1]))[0].games; const h = await rows('select 1 from public.athlete_rating_history where athlete_id=$1', [a1]); return g.length === 2 && h.length === 2; }));
await t('rpc: unchanged rating adds no row', () => admin(async () => { await save(a1, 'สมชาย ใจดี', '{crossword,a_math}', [{ game: 'crossword', value: 1500 }, { game: 'a_math', value: 1400 }]); return (await rows('select 1 from public.athlete_rating_history where athlete_id=$1', [a1])).length === 2; }));
await t('rpc: changed rating appends, history kept, current updates', () => admin(async () => { await save(a1, 'สมชาย ใจดี', '{crossword,a_math}', [{ game: 'crossword', value: 1550 }], { date: '2026-02-01' });
  const h = await rows(`select 1 from public.athlete_rating_history where athlete_id=$1 and game_type='crossword'`, [a1]); const c = await rows(`select rating_value from public.current_ratings where athlete_id=$1 and game_type='crossword'`, [a1]); return h.length === 2 && Number(c[0].rating_value) === 1550; }));
await t('rpc: edit name/school/province works', () => admin(async () => { await save(a1, 'สมชาย ใจดีมาก', '{crossword,a_math}', [], { school: 'โรงเรียน ข', prov: 'เชียงใหม่' }); const r = (await rows('select full_name, school_name, province from public.athletes where id=$1', [a1]))[0]; return r.full_name === 'สมชาย ใจดีมาก' && r.school_name === 'โรงเรียน ข' && r.province === 'เชียงใหม่'; }));
await t('rpc: rejects negative / unknown game / blank name', () => admin(async () => (await throws(() => save(null, 'n', '{crossword}', [{ game: 'crossword', value: -1 }]))) && (await throws(() => save(null, 'n', '{tennis}', []))) && (await throws(() => save(null, ' ', '{crossword}', [])))));
await t('rpc: Sudoku/Kumkom rejected (no ratings)', () => admin(async () => (await throws(() => save(null, 'n', '{sudoku}', []))) && (await throws(() => save(null, 'n', '{crossword,kumkom}', [])))));
await t('failed rpc leaves no partial athlete', () => admin(async () => (await rows(`select 1 from public.athletes where full_name='n'`)).length === 0));
// ---- ranking view
await t('ranking setup', () => admin(async () => { a2 = await save(null, 'ข ทดสอบ', '{crossword}', [{ game: 'crossword', value: 1550 }]); a3 = await save(null, 'ค ร่าง', '{crossword}', [{ game: 'crossword', value: 2000 }], { pub: 'draft' });
  a4 = await save(null, 'ง ไม่ใช้งาน', '{crossword}', [{ game: 'crossword', value: 1900 }], { active: false }); a5 = await save(null, 'จ ท้าย', '{crossword}', [{ game: 'crossword', value: 1000 }]); return true; }));
const RK = `select athlete_id, full_name, school_name, province, game_type, rating_value, effective_date, rating_period, rank from public.national_rankings where game_type=$1 order by rating_value desc, full_name`;
await t('ranking: anon sees published+active only; ties share rank (1,1,3)', () => anon(async () => { const r = await rows(RK, ['crossword']); return r.length === 3 && [r[0].rank, r[1].rank, r[2].rank].join() === '1,1,3'; }));
await t('ranking: separate per game', () => anon(async () => { const r = await rows(RK, ['a_math']); return r.length === 1 && Number(r[0].rating_value) === 1400; }));
await t('ranking: sudoku/kumkom rows never appear', () => anon(async () => (await rows(`select 1 from public.national_rankings where game_type in ('sudoku','kumkom')`)).length === 0));
await t('ranking: older effective date with later insert does not override', () => admin(async () => { await rows(`insert into public.athlete_rating_history (athlete_id,game_type,rating_value,effective_date,source_type,publication_status) values ($1,'crossword',9999,'2025-01-01','manual','published')`, [a1]);
  return Number((await rows(`select rating_value from public.current_ratings where athlete_id=$1 and game_type='crossword'`, [a1]))[0].rating_value) === 1550; }));
await t('ranking: archived rating drops out', () => admin(async () => { await rows(`update public.athlete_rating_history set publication_status='archived' where athlete_id=$1 and game_type='crossword'`, [a5]); return (await anon(() => rows(RK, ['crossword']))).length === 2; }));
await t('ranking: un-selecting a game hides it, history kept', () => admin(async () => { await save(a2, 'ข ทดสอบ', '{}', []); const n = (await rows('select 1 from public.athlete_rating_history where athlete_id=$1', [a2])).length; return n === 1 && (await anon(() => rows(RK, ['crossword']))).length === 1; }));
// ---- history integrity & security
await t('history: value immutable', () => admin(() => throws(() => rows(`update public.athlete_rating_history set rating_value = 1 where athlete_id=$1`, [a1]))));
await t('history: admin delete blocked (no DELETE policy)', () => admin(() => blocked(`delete from public.athlete_rating_history returning id`)));
await t('athletes: delete restricted when history exists', () => admin(() => throws(() => rows(`delete from public.athletes where id=$1`, [a1]))));
await t('history: anon/non-admin cannot insert', async () => (await anon(() => blocked(`insert into public.athlete_rating_history (athlete_id,game_type,rating_value,effective_date,source_type) values ($1,'crossword',1,'2026-01-01','manual') returning id`, [a1]))) && (await user(() => blocked(`insert into public.athlete_rating_history (athlete_id,game_type,rating_value,effective_date,source_type) values ($1,'crossword',1,'2026-01-01','manual') returning id`, [a1]))));
await t('history: direct admin insert for sudoku rejected', () => admin(() => throws(() => rows(`insert into public.athlete_rating_history (athlete_id,game_type,rating_value,effective_date,source_type) values ($1,'sudoku',1,'2026-01-01','manual')`, [a1]))));
await t('history: anon cannot read draft athlete or inactive athlete ratings', () => anon(async () => (await rows(`select 1 from public.athlete_rating_history where athlete_id in ($1,$2)`, [a3, a4])).length === 0));
await t('history: anon cannot read notes/source/created_by columns', () => anon(() => throws(() => rows('select notes from public.athlete_rating_history'))));
await t('athletes: anon select * denied, allow-list works', () => anon(async () => (await throws(() => rows('select * from public.athletes'))) && (await rows('select id, full_name, school_name, province, games from public.athletes where publication_status=\'published\'')).length >= 1));
await t('athletes: no admin_notes / date_of_birth columns', async () => (await rows(`select 1 from information_schema.columns where table_name='athletes' and column_name in ('admin_notes','date_of_birth')`)).length === 0);
await t('athletes: non-admin cannot write', () => user(() => blocked(`update public.athletes set full_name='x' returning id`)));
await t('news/events: anon cannot read created_by', async () => (await anon(() => throws(() => rows('select created_by from public.news')))) && (await anon(() => throws(() => rows('select created_by from public.events')))));
await t('hall_of_fame: anon cannot read (feature removed)', () => anon(() => throws(() => rows('select id from public.hall_of_fame'))));
await t('game_types: labels + has_rating', () => anon(async () => { const m = Object.fromEntries((await rows('select code,label_th,has_rating from public.game_types')).map(r => [r.code, r])); return m.a_math.label_th === 'เอแม็ท' && m.kumkom.label_th === 'คำคม' && m.crossword.has_rating && m.a_math.has_rating && !m.sudoku.has_rating && !m.kumkom.has_rating; }));
// ---- admin contract queries (what the admin UI runs)
await t('admin UI queries run (dashboard counts, athletes list, current_ratings, history)', () => admin(async () => {
  await rows(`select count(*) from public.news where status='published'`); await rows(`select count(*) from public.events where publication_status='published' and competition_status in ('upcoming','registration_open')`);
  await rows('select id, title, created_at from public.news order by created_at desc limit 5'); await rows('select id, full_name, created_at from public.athletes order by created_at desc limit 5');
  await rows('select id,full_name,school_name,province,games,publication_status,is_active from public.athletes order by id'); await rows('select athlete_id,game_type,rating_value from public.current_ratings order by athlete_id, game_type');
  await rows(`select id,game_type,rating_value,effective_date,publication_status from public.athlete_rating_history where athlete_id=$1 order by effective_date desc, created_at desc`, [a1]); return true; }));
// ---- Hall of Fame leftovers
await t('hall_of_fame: event snapshot kept when event title changes', () => admin(async () => { const ev = (await rows(`select id from public.events where slug='e1'`))[0].id;
  await rows(`insert into public.hall_of_fame (athlete_name,achievement_year,event_id,game_type,status) values ('x',2026,$1,'crossword','published')`, [ev]); await rows(`update public.events set title='ชื่อใหม่' where id=$1`, [ev]);
  return (await rows(`select event_name from public.hall_of_fame where athlete_name='x'`))[0].event_name === 'งานแข่ง'; }));
// ---- FAQ (Q&A)
if (files.length >= 5) {
  const Q = (st, g) => `insert into public.faqs (question,answer,game_type,sort_order,status,created_by) values ('คำถามทดสอบ ${st}','คำตอบภาษาไทย',${g},1,'${st}','${A}') returning id`;
  await t('faqs: admin creates (Thai) and default status is draft', () => admin(async () => { await rows(Q('published', 'null')); await rows(Q('draft', "'crossword'")); await rows(Q('archived', 'null')); return (await rows(`insert into public.faqs (question,answer) values ('x','y') returning status`))[0].status === 'draft'; }));
  await t('faqs: anon sees only published (allow-listed columns)', () => anon(async () => { const r = await rows('select id,question,answer,game_type,sort_order,status,created_at,updated_at from public.faqs'); return r.length === 1 && r[0].answer === 'คำตอบภาษาไทย'; }));
  await t('faqs: anon cannot read created_by', () => anon(() => throws(() => rows('select created_by from public.faqs'))));
  await t('faqs: anon / non-admin / inactive admin cannot write', async () => (await anon(() => blocked(Q('published', 'null')))) && (await user(() => blocked(Q('published', 'null')))) && (await old(() => blocked(Q('published', 'null')))));
  await t('faqs: anon / non-admin cannot update or delete', async () => (await anon(() => blocked(`update public.faqs set answer='x' returning id`))) && (await user(() => blocked(`delete from public.faqs returning id`))));
  await t('faqs: invalid game_type and blank text rejected', () => admin(async () => (await throws(() => rows(Q('draft', "'chess'")))) && (await throws(() => rows(`insert into public.faqs (question,answer) values (' ','y')`)))));
  await t('faqs: admin can update and delete', () => admin(async () => (await rows(`update public.faqs set answer='ใหม่' where status='published' returning id`)).length === 1 && (await rows(`delete from public.faqs where status='archived' returning id`)).length === 1));
}
// ---- structure
await t('RLS enabled on every public table', async () => (await rows(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`)).length === 0);
await t('function privileges: save RPC authenticated only; is_admin callable', async () => (await rows(`select has_function_privilege('anon','public.admin_save_athlete(uuid,text,text,text,text[],text,boolean,jsonb,date)','execute') a, has_function_privilege('authenticated','public.admin_save_athlete(uuid,text,text,text,text[],text,boolean,jsonb,date)','execute') b, has_function_privilege('anon','public.is_admin()','execute') c`))[0].a === false);
await t('storage: 3 image buckets (5MB, jpeg/png/webp) + policies', async () => (await rows(`select 1 from storage.buckets where file_size_limit=5242880 and allowed_mime_types @> array['image/jpeg','image/png','image/webp']`)).length === 3 && (await rows(`select 1 from pg_policies where tablename='objects'`)).length >= 2);
for (const f of files.slice(-2)) await t(`idempotent: ${f}`, async () => { const s = fs.readFileSync(dir + f, 'utf8'); await db.exec(s); await db.exec(s); return true; });
console.log(`upto ${upto}: ${pass} passed, ${failed.length} failed`); failed.forEach(f => console.log(' FAIL:', f));
