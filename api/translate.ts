// Vercel Edge Function: POST /api/translate { texts: string[] } → { translations: string[] }
// Admins only: the caller's Supabase session is checked with the database function is_admin().
import { gtranslate, validTexts } from './_gtranslate';
export const config = { runtime: 'edge' };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return json({ error: 'server not configured' }, 500);
  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer \S+$/.test(auth)) return json({ error: 'unauthorized' }, 401);
  const check = await fetch(`${url}/rest/v1/rpc/is_admin`, { method: 'POST', headers: { apikey: key, Authorization: auth, 'Content-Type': 'application/json' }, body: '{}' });
  if (!check.ok || (await check.json()) !== true) return json({ error: 'forbidden' }, 403);
  let body: unknown; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const texts = validTexts(body); if (!texts) return json({ error: 'bad request' }, 400);
  try {
    const translations: string[] = [];
    for (const t of texts) translations.push(await gtranslate(t));
    return json({ translations });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
}
