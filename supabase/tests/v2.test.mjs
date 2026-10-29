// Tests migration 7 (v2) on a real Postgres (PGlite) with Supabase-style roles.
// 1) run migrations 1-6, 2) insert data in the OLD shape, 3) run migration 7 twice, 4) check data mapping, RLS and new rules.
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import { fileURLToPath } from 'url';
const dir = fileURLToPath(new URL('../migrations/', import.meta.url));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
const old = files.slice(0, 6), v2 = files.slice(6);
const db = new PGlite();
await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
 create table auth.users (id uuid primary key default gen_random_uuid(), email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 create schema storage; create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
 create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text); alter table storage.objects enable row level security;
 grant usage on schema public, auth, storage to anon, authenticated;
 alter default privileges in schema public grant all on tables to anon, authenticated;
 alter default privileges in schema public grant execute on functions to anon, authenticated;`);
const run = async list => { for (const f of list) { try { await db.exec(fs.readFileSync(dir + f, 'utf8')); } catch (e) { console.log('MIGRATION ERROR', f, e.message); process.exit(1); } } };
await run(old);
const A = '00000000-0000-0000-0000-0000000000a1', U = '00000000-0000-0000-0000-0000000000a2';
await db.exec(`insert into auth.users(id,email) values ('${A}','a@x'),('${U}','u@x'); insert into public.admin_profiles(user_id,display_name,is_active) values ('${A}','Admin',true);`);

// ---- legacy data (old shape)
await db.exec(`
 insert into public.news (category,title,slug,content,status,image_url) values
  ('ประกาศทั่วไป','ข่าวทั่วไป','n-gen','x','published','https://img/a.jpg'),
  ('ผลการแข่งขัน','ผลแข่ง','n-res','x','published',null),
  ('ประกาศการแข่งขัน','ประกาศแข่ง','n-comp','x','published',null),
  ('ข่าวกิจกรรม','กิจกรรม','n-act','x','archived',null);
 insert into public.events (title,slug,category,game_type,start_date,end_date,description,competition_status,publication_status,image_url) values
  ('แข่ง 1','e-1','tournament','a_math','2026-03-01',null,'d','upcoming','published','https://img/e.jpg'),
  ('แข่ง 2','e-2','event','multiple','2026-03-01','2026-03-03','d','completed','archived',null),
  ('แข่ง 3','e-3','training','other','2026-03-01',null,'d','upcoming','draft',null);
 insert into public.faqs (question,answer,status) values ('q pub','a','published'),('q draft','a','draft'),('q arch','a','archived');`);
const legacyAth = async (name, pub, active) => (await db.query(`insert into public.athletes (full_name,publication_status,is_active,games) values ($1,$2,$3,'{crossword}') returning id`, [name, pub, active])).rows[0].id;
const athPub = await legacyAth('เผยแพร่', 'published', true), athDraft = await legacyAth('ร่าง', 'draft', true), athOff = await legacyAth('ปิด', 'published', false);
await db.exec(`insert into public.athlete_rating_history (athlete_id,game_type,rating_value,effective_date,source_type,publication_status) values
 ('${athPub}','crossword',1500,'2026-01-01','manual','published'),('${athDraft}','crossword',1600,'2026-01-01','manual','published'),('${athOff}','crossword',1700,'2026-01-01','manual','published');`);

await run(v2); await run(v2); // idempotent

let pass = 0; const failed = [];
const t = async (n, fn) => { try { (await fn()) ? pass++ : failed.push(n); } catch (e) { failed.push(n + ' -> ' + e.message.split('\n')[0]); } };
const as = async (role, uid, fn) => { await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${uid ?? ''}',false);`); try { return await fn(); } finally { await db.exec('reset role'); } };
const rows = async (s, p) => (await db.query(s, p)).rows;
const throws = async (fn, msg) => { try { await fn(); return false; } catch (e) { return msg ? e.message.includes(msg) : true; } };
const blocked = async (s, p) => { try { return (await db.query(s, p)).rows.length === 0; } catch { return true; } };
const anon = fn => as('anon', null, fn), admin = fn => as('authenticated', A, fn), user = fn => as('authenticated', U, fn);
const one = async (s, p) => (await rows(s, p))[0];

// ---- data mapping
await t('news: categories mapped to general/competition', async () => { const m = Object.fromEntries((await rows('select slug, category from public.news')).map(r => [r.slug, r.category]));
  return m['n-gen'] === 'general' && m['n-res'] === 'competition' && m['n-comp'] === 'competition' && m['n-act'] === 'general'; });
await t('news: archived -> draft; image_url -> images[1]', async () => (await one(`select status from public.news where slug='n-act'`)).status === 'draft'
  && (await one(`select images from public.news where slug='n-gen'`)).images.join() === 'https://img/a.jpg');
await t('events: game_type -> games (multiple = all four, other = none)', async () => { const m = Object.fromEntries((await rows('select slug, games from public.events')).map(r => [r.slug, r.games.join()]));
  return m['e-1'] === 'a_math' && m['e-2'] === 'crossword,a_math,kumkom,sudoku' && m['e-3'] === ''; });
await t('events: archived -> draft; reg_close/last_date generated', async () => { const r = await one(`select publication_status, reg_close::text rc, last_date::text ld from public.events where slug='e-2'`);
  return r.publication_status === 'draft' && r.rc === '2026-02-28' && r.ld === '2026-03-03'; });
await t('athletes: draft/inactive -> archived, all active', async () => { const m = Object.fromEntries((await rows('select id, publication_status, is_active from public.athletes')).map(r => [r.id, r]));
  return m[athPub].publication_status === 'published' && m[athDraft].publication_status === 'archived' && m[athOff].publication_status === 'archived' && Object.values(m).every(r => r.is_active); });
await t('faqs: draft -> archived', async () => (await rows(`select 1 from public.faqs where status='archived'`)).length === 2);
await t('constraints: old statuses rejected', () => admin(async () => (await throws(() => rows(`update public.news set status='archived' where slug='n-gen'`)))
  && (await throws(() => rows(`update public.events set publication_status='archived' where slug='e-1'`))) && (await throws(() => rows(`update public.faqs set status='draft'`)))
  && (await throws(() => rows(`update public.news set category='ข่าวอื่น ๆ' where slug='n-act'`)))));

// ---- news & events for anon
await t('anon reads new news columns, not edit_note', () => anon(async () => (await rows(`select id, images, title_en, excerpt_en, content_en, category from public.news`)).length === 3
  && (await throws(() => rows('select edit_note from public.news')))));
await t('anon reads new event columns', () => anon(async () => (await rows(`select id, images, games, registration_deadline, reg_close, last_date, title_en, venue_en, description_en, created_at from public.events`)).length === 1));
await t('events: computed status filters work (open / closed / ended)', () => admin(async () => {
  await rows(`insert into public.events (title,slug,start_date,end_date,registration_deadline,description,publication_status,games) values ('f','f-1','2026-12-10','2026-12-11','2026-12-01','d','published','{crossword}')`);
  const today = '2026-12-05';
  const open = (await rows(`select slug from public.events where reg_close >= $1`, [today])).map(r => r.slug);
  const closed = (await rows(`select slug from public.events where reg_close < $1 and last_date >= $1`, [today])).map(r => r.slug);
  const ended = (await rows(`select slug from public.events where last_date < $1`, ['2026-12-12'])).map(r => r.slug);
  return open.join() === '' && closed.join() === 'f-1' && ended.includes('f-1'); }));
await t('events: deadline after end date rejected; invalid game rejected', () => admin(async () =>
  (await throws(() => rows(`insert into public.events (title,slug,start_date,registration_deadline,description,publication_status) values ('x','x1','2026-12-10','2026-12-20','d','draft')`)))
  && (await throws(() => rows(`insert into public.events (title,slug,start_date,description,publication_status,games) values ('x','x2','2026-12-10','d','draft','{chess}')`)))));
await t('cover image follows images[1]', () => admin(async () => { await rows(`update public.events set images='{https://img/1.jpg,https://img/2.jpg}', edit_note='เพิ่มรูป' where slug='f-1'`);
  return (await one(`select image_url from public.events where slug='f-1'`)).image_url === 'https://img/1.jpg'; }));

// ---- edit history
await t('published edit without note is rejected', () => admin(() => throws(() => rows(`update public.news set title='แก้ไข' where slug='n-gen'`), 'EDIT_NOTE_REQUIRED')));
await t('published edit with note: saved, note cleared, revision stored', () => admin(async () => {
  await rows(`update public.news set title='แก้ไข', edit_note='แก้ชื่อข่าว', edit_note_en='Fixed the title' where slug='n-gen'`);
  const n = await one(`select id, title, edit_note from public.news where slug='n-gen'`); const r = await rows(`select note, note_en from public.content_revisions where entity='news' and entity_id=$1`, [n.id]);
  return n.title === 'แก้ไข' && n.edit_note === null && r.length === 1 && r[0].note === 'แก้ชื่อข่าว' && r[0].note_en === 'Fixed the title'; }));
await t('pin / status / English-only changes need no note', () => admin(async () => {
  await rows(`update public.news set is_pinned=true where slug='n-gen'`); await rows(`update public.news set title_en='Edited' where slug='n-gen'`);
  return (await rows(`select 1 from public.content_revisions where entity='news'`)).length === 1; }));
await t('draft edits need no note and leave no history', () => admin(async () => { await rows(`update public.news set title='ร่างใหม่' where slug='n-act'`); return (await rows(`select 1 from public.content_revisions where entity='news'`)).length === 1; }));
await t('events revisions work too', () => admin(async () => (await throws(() => rows(`update public.events set venue='ที่ใหม่' where slug='f-1'`), 'EDIT_NOTE_REQUIRED'))
  && (await rows(`update public.events set venue='ที่ใหม่', edit_note='เปลี่ยนสถานที่' where slug='f-1' returning id`)).length === 1));
await t('insert ignores edit_note', () => admin(async () => (await one(`insert into public.news (category,title,slug,content,status,edit_note) values ('general','t','n-new','c','published','x') returning edit_note`)).edit_note === null));
await t('anon sees revisions of published items only', () => anon(async () => { const r = await rows('select entity, note, note_en, edited_at from public.content_revisions');
  return r.length === 3 && (await throws(() => rows('select edited_by from public.content_revisions'))); }));
await t('anon cannot write revisions', () => anon(() => blocked(`insert into public.content_revisions (entity,entity_id,note) values ('news',gen_random_uuid(),'x') returning id`)));
await t('unpublished item hides its revisions', () => admin(async () => { await rows(`update public.events set publication_status='draft' where slug='f-1'`);
  return (await anon(() => rows(`select 1 from public.content_revisions where entity='events'`))).length === 0; }));
await t('deleting an item deletes its revisions', () => admin(async () => { await rows(`delete from public.events where slug='f-1'`); return (await rows(`select 1 from public.content_revisions where entity='events'`)).length === 0; }));

// ---- athletes
const SAVE = `select public.admin_save_athlete($1::uuid,$2::text,$3::text,$4::text,$5::text[],$6::text,$7::jsonb,$8::date) id`;
const save = (id, th, en, games, ratings, o = {}) => rows(SAVE, [id, th, en, o.photo ?? null, games, o.pub ?? 'published', JSON.stringify(ratings), '2026-02-01']).then(r => r[0].id);
let ath;
await t('rpc: Thai and English names both required', () => admin(async () => (await throws(() => save(null, 'สมหญิง', ' ', '{a_math}', []))) && (await throws(() => save(null, ' ', 'Somying', '{a_math}', [])))));
await t('rpc: saves photo + English name + rating', () => admin(async () => { ath = await save(null, 'สมหญิง เก่ง', 'Somying Keng', '{a_math}', [{ game: 'a_math', value: 1800 }], { photo: 'https://img/p.jpg' });
  const r = await one('select full_name_en, photo_url, publication_status, is_active from public.athletes where id=$1', [ath]); return r.full_name_en === 'Somying Keng' && r.photo_url === 'https://img/p.jpg' && r.is_active; }));
await t('rpc: draft status rejected; anon / non-admin denied', async () => (await admin(() => throws(() => save(null, 'ก', 'K', '{a_math}', [], { pub: 'draft' }))))
  && (await anon(() => throws(() => save(null, 'ก', 'K', '{a_math}', [])))) && (await user(() => throws(() => save(null, 'ก', 'K', '{a_math}', [])))));
await t('ranking view: photo + English name, no school/province', () => anon(async () => { const r = await rows(`select athlete_id, full_name, full_name_en, photo_url, rank from public.national_rankings where game_type='a_math'`);
  return r.length === 1 && r[0].full_name_en === 'Somying Keng' && (await throws(() => rows('select school_name from public.national_rankings'))); }));
await t('ranking view: archived athletes hidden', () => anon(async () => (await rows(`select full_name from public.national_rankings where game_type='crossword'`)).map(r => r.full_name).join() === 'เผยแพร่'));
await t('rpc: archive hides from ranking', () => admin(async () => { await save(ath, 'สมหญิง เก่ง', 'Somying Keng', '{a_math}', [], { pub: 'archived' }); return (await anon(() => rows(`select 1 from public.national_rankings where game_type='a_math'`))).length === 0; }));
await t('athlete comments: admin writes/reads, anon and non-admin cannot', async () => {
  await admin(() => rows(`insert into public.athlete_comments (athlete_id, body) values ($1, 'ความเห็นภายใน')`, [ath]));
  const mine = await admin(() => rows('select body, created_by from public.athlete_comments'));
  return mine.length === 1 && mine[0].created_by === A && (await anon(() => blocked('select body from public.athlete_comments'))) && (await user(() => blocked('select body from public.athlete_comments')))
    && (await anon(() => blocked(`insert into public.athlete_comments (athlete_id, body) values ('${ath}', 'x') returning id`))); });

// ---- Q&A
await t('faqs: anon reads English columns; default status published', async () => (await anon(async () => (await rows('select question_en, answer_en from public.faqs')).length === 1))
  && (await admin(async () => (await one(`insert into public.faqs (question,answer) values ('ใหม่','ตอบ') returning status`)).status === 'published')));
await t('submissions: anon can send a question (no return) but cannot read', () => anon(async () => {
  await db.query(`insert into public.faq_submissions (question) values ('สมัครแข่งขันอย่างไรครับ')`);
  return (await blocked('select question from public.faq_submissions')) && (await throws(() => rows(`insert into public.faq_submissions (question, status) values ('ทดสอบคำถาม', 'answered')`))); }));
await t('submissions: too short rejected', () => anon(() => throws(() => rows(`insert into public.faq_submissions (question) values ('ab')`))));
await t('submissions: admin reads and updates', () => admin(async () => (await rows(`update public.faq_submissions set status='answered' returning id`)).length === 1));
await t('submissions: flood guard (30 per 10 minutes)', () => anon(async () => { for (let i = 0; i < 29; i++) await db.query(`insert into public.faq_submissions (question) values ('คำถามที่ ${i} ทดสอบ')`);
  return throws(() => db.query(`insert into public.faq_submissions (question) values ('คำถามเกินจำนวน')`), 'TOO_MANY'); }));

// ---- analytics
const V = '11111111-1111-1111-1111-111111111111', S = '22222222-2222-2222-2222-222222222222';
await t('page_views: anon inserts, cannot read', () => anon(async () => { await db.query(`insert into public.page_views (visitor_id, session_id, path, device, lang) values ($1,$2,'/news','mobile','th'),($1,$2,'/','mobile','th')`, [V, S]);
  return blocked('select path from public.page_views'); }));
await t('page_views: bad device rejected', () => anon(() => throws(() => rows(`insert into public.page_views (visitor_id, session_id, path, device) values ('${V}','${S}','/','tv')`))));
await t('analytics RPC: admin gets totals, daily series and top pages', () => admin(async () => {
  await rows(`insert into public.page_views (visitor_id, session_id, path, entity, entity_id, created_at) select gen_random_uuid(), gen_random_uuid(), '/news/x', 'news', (select id from public.news where slug='n-gen'), now() - interval '40 days'`);
  const a = (await one('select public.admin_analytics(30) a')).a;
  return a.today.visitors === 1 && a.today.views === 2 && a.all_time.views === 3 && a.all_time.visitors === 2 && a.range.views === 2 && a.daily.length === 30
    && a.daily.at(-1).views === 2 && a.top_pages.length === 2 && a.hours.length === 24 && a.devices[0].device === 'mobile' && a.top_news.length === 0; }));
await t('analytics RPC: anon / non-admin denied', async () => (await anon(() => throws(() => rows('select public.admin_analytics(30)')))) && (await user(() => throws(() => rows('select public.admin_analytics(30)')))));

// ---- structure
await t('RLS enabled on every public table', async () => (await rows(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`)).length === 0);
await t('old 9-argument save RPC removed', async () => (await rows(`select 1 from pg_proc where proname='admin_save_athlete'`)).length === 1);

console.log(`v2: ${pass} passed, ${failed.length} failed`); failed.forEach(f => console.log(' FAIL:', f));
if (failed.length) process.exit(1);
