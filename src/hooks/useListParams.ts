import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DateRange } from '../services/publicService';
import { useDebounced } from './usePublic';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/**
 * List filters kept in the URL (?q=&f=&from=&to=&page=) so Back/Forward and shared links restore the same view.
 * `f` is the page's main filter (news category or competition status).
 */
export function useListParams(allowedFilter: string[]) {
  const [sp, setSp] = useSearchParams();
  const urlQ = sp.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const dq = useDebounced(q, 350);
  const f = allowedFilter.includes(sp.get('f') ?? '') ? sp.get('f')! : '';
  const from = sp.get('from') ?? '', to = sp.get('to') ?? '';
  const range: DateRange | null = DATE.test(from) && DATE.test(to) ? (from <= to ? { from, to } : { from: to, to: from }) : null;
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1);

  const update = useCallback((patch: Record<string, string | null>, resetPage = true) => {
    setSp(prev => {
      const n = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); }
      if (resetPage && !('page' in patch)) n.delete('page');
      return n;
    }, { replace: !('page' in patch) });
  }, [setSp]);
  useEffect(() => { if (dq !== urlQ) update({ q: dq.trim() || null }); }, [dq]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setQ(urlQ); }, [urlQ]); // Back/Forward

  return {
    q, setQ, dq: urlQ, filter: f, range, page,
    setFilter: (v: string) => update({ f: v || null }),
    setRange: (r: DateRange | null) => update({ from: r?.from ?? null, to: r?.to ?? null }),
    setPage: (p: number) => update({ page: p > 1 ? String(p) : null }, false),
    clear: () => { setQ(''); setSp(new URLSearchParams(), { replace: true }); },
    active: !!(urlQ || f || range),
  };
}
