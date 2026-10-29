// Tiny stale-while-revalidate cache for read queries.
// - Pages show cached data instantly when you come back to them, then refresh quietly in the background.
// - Identical requests running at the same time share one network call.
// - prefetch() lets links load the next page's data on hover, before the click.
import { useEffect, useReducer, useRef, useSyncExternalStore } from 'react';

interface Entry { data?: unknown; error?: unknown; promise?: Promise<unknown>; at: number; subs: Set<() => void> }
const cache = new Map<string, Entry>();
const DEFAULT_STALE = 60_000;

let inflight = 0;
const busySubs = new Set<() => void>();
const setBusy = (d: number) => { inflight += d; busySubs.forEach(f => f()); };
/** Number of queries currently loading (drives the top progress bar). */
export const useIsFetching = () => useSyncExternalStore(cb => { busySubs.add(cb); return () => { busySubs.delete(cb); }; }, () => inflight, () => 0);

const entry = (key: string) => { let e = cache.get(key); if (!e) { e = { at: 0, subs: new Set() }; cache.set(key, e); } return e; };
const notify = (e: Entry) => e.subs.forEach(f => f());

export function fetchQuery<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const e = entry(key);
  if (e.promise) return e.promise as Promise<T>;
  setBusy(1);
  const p = fn().then(d => { e.data = d; e.error = undefined; e.at = Date.now(); return d; })
    .catch(err => { e.error = err; throw err; })
    .finally(() => { e.promise = undefined; setBusy(-1); notify(e); });
  e.promise = p;
  p.catch(() => {});
  return p;
}
export const isFresh = (key: string, staleMs = DEFAULT_STALE) => { const e = cache.get(key); return !!e && e.data !== undefined && Date.now() - e.at < staleMs; };
export function prefetch<T>(key: string, fn: () => Promise<T>, staleMs = DEFAULT_STALE) { if (!isFresh(key, staleMs)) fetchQuery(key, fn).catch(() => {}); }
export const getCached = <T,>(key: string) => cache.get(key)?.data as T | undefined;
export const setCached = <T,>(key: string, data: T) => { const e = entry(key); e.data = data; e.at = Date.now(); notify(e); };
export function invalidate(prefix: string) { for (const [k, e] of cache) if (k.startsWith(prefix)) { e.at = 0; notify(e); } }

export interface QueryState<T> { data: T | undefined; error: boolean; loading: boolean; /** showing the previous key's data while the new key loads */ placeholder: boolean; refetch: () => void }

export function useQuery<T>(key: string | null, fn: () => Promise<T>, opts: { staleMs?: number; keepPrevious?: boolean } = {}): QueryState<T> {
  const { staleMs = DEFAULT_STALE, keepPrevious = false } = opts;
  const [, force] = useReducer((x: number) => x + 1, 0);
  const fnRef = useRef(fn); fnRef.current = fn;
  const prev = useRef<T | undefined>(undefined);
  useEffect(() => {
    if (!key) return;
    const e = entry(key); e.subs.add(force);
    if (!e.promise && (e.data === undefined || e.error !== undefined || Date.now() - e.at > staleMs)) fetchQuery(key, () => fnRef.current()).catch(() => {});
    force();
    return () => { e.subs.delete(force); };
  }, [key, staleMs]);
  const e = key ? cache.get(key) : undefined;
  const data = e?.data as T | undefined;
  if (data !== undefined) prev.current = data;
  const placeholder = data === undefined && keepPrevious && prev.current !== undefined;
  return {
    data: data ?? (keepPrevious ? prev.current : undefined),
    error: data === undefined && e?.error !== undefined && !e?.promise,
    loading: data === undefined && (!e || !!e.promise || e.error === undefined),
    placeholder,
    refetch: () => { if (key) fetchQuery(key, () => fnRef.current()).catch(() => {}); },
  };
}
