// Anonymous page-view tracking for the admin dashboard.
// Stores: a random browser id, a random visit id, the page path, the referring site, device type and language.
// No IP address, no name, no cookies. Admin visits, /admin pages and automated browsers are not counted.
import { supabase } from '../services/supabase';
import type { Lang } from '../i18n';

const VID = 'tca-vid', SID = 'tca-sid', SESSION_IDLE_MS = 30 * 60_000;
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
function store(kind: Storage | undefined, key: string): { get: () => string | null; set: (v: string) => void } {
  return { get: () => { try { return kind?.getItem(key) ?? null; } catch { return null; } }, set: v => { try { kind?.setItem(key, v); } catch { /* blocked */ } } };
}
function visitorId() { const s = store(window.localStorage, VID); let v = s.get(); if (!v) { v = uuid(); s.set(v); } return v; }
/** A visit ends after 30 minutes without a page view. Returns [id, isNewVisit]. */
function sessionId(): [string, boolean] {
  const s = store(window.sessionStorage, SID); const raw = s.get(); const now = Date.now();
  if (raw) { const [id, at] = raw.split('|'); if (id && now - Number(at) < SESSION_IDLE_MS) { s.set(`${id}|${now}`); return [id, false]; } }
  const id = uuid(); s.set(`${id}|${now}`); return [id, true];
}
function device(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent; const w = Math.min(window.screen?.width ?? 1280, window.innerWidth || 1280);
  if (/iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua) || w < 640) return 'mobile';
  return w < 1024 && navigator.maxTouchPoints > 0 ? 'tablet' : 'desktop';
}
function referrerHost(): string | null {
  try { if (!document.referrer) return null; const h = new URL(document.referrer).hostname; return h && h !== window.location.hostname ? h.slice(0, 200) : null; } catch { return null; }
}
const ENTITY = /^\/(news|events)\/([0-9a-f-]{36})$/i;
let last = { path: '', at: 0 };
let isAdmin: boolean | null = null;

export async function trackPageView(path: string, lang: Lang) {
  if (path.startsWith('/admin') || navigator.webdriver || /bot|crawl|spider|preview|lighthouse/i.test(navigator.userAgent)) return;
  const now = Date.now(); if (last.path === path && now - last.at < 1500) return; // React strict-mode double effects
  last = { path, at: now };
  if (isAdmin === null) { const { data } = await supabase.auth.getSession(); isAdmin = !!data.session; }
  if (isAdmin) return;
  const [sid, fresh] = sessionId(); const m = ENTITY.exec(path);
  await supabase.from('page_views').insert({
    visitor_id: visitorId(), session_id: sid, path: path.slice(0, 300), entity: m ? m[1].toLowerCase() : null, entity_id: m ? m[2] : null,
    referrer_host: fresh ? referrerHost() : null, device: device(), lang,
  });
}
supabase.auth.onAuthStateChange((_e, s) => { isAdmin = !!s; });
