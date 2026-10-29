// Shared by the Vercel function (api/translate.ts) and the Vite dev server (vite.config.ts).
// Files starting with "_" inside /api are not deployed as functions by Vercel.
export async function gtranslate(text: string): Promise<string> {
  if (!text.trim()) return '';
  const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=en&dt=t', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams({ q: text }).toString(),
  });
  if (!r.ok) throw new Error(`google ${r.status}`);
  const j = (await r.json()) as [[string, string][]];
  return (j[0] ?? []).map(seg => seg[0]).join('');
}
export function validTexts(body: unknown): string[] | null {
  const texts = (body as { texts?: unknown })?.texts;
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > 50 || !texts.every(t => typeof t === 'string')) return null;
  return texts.reduce((n, t) => n + (t as string).length, 0) > 40_000 ? null : (texts as string[]);
}
