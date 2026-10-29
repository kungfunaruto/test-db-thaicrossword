import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronDown, Loader2, MessageCircleQuestion, Send } from 'lucide-react';
import { FAQ_KEY, fetchFaqs, submitQuestion } from '../services/publicService';
import { useQuery } from '../lib/query';
import { usePageMeta } from '../hooks/usePublic';
import { loc, useLang } from '../i18n';
import { nb } from '../utils/labels';
import PageHeader from '../components/common/PageHeader';
import Segmented from '../components/common/Segmented';
import SearchInput from '../components/common/SearchInput';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';

const LAST = 'tca-last-question';
function AskForm() {
  const { t } = useLang();
  const [text, setText] = useState(''); const [hp, setHp] = useState(''); // hp = hidden field that only bots fill in
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle'); const [err, setErr] = useState('');
  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setErr('');
    const v = text.trim();
    if (v.length < 5) return setErr(t.qa.tooShort);
    if (v.length > 1000) return setErr(t.qa.tooLong);
    let last = 0; try { last = Number(localStorage.getItem(LAST) ?? 0); } catch { /* ignore */ }
    if (Date.now() - last < 30_000) return setErr(t.qa.wait);
    if (hp) { setState('sent'); return; }
    setState('sending');
    try { await submitQuestion(v); try { localStorage.setItem(LAST, String(Date.now())); } catch { /* ignore */ } setState('sent'); setText(''); }
    catch (x) { setState('idle'); setErr(String((x as { message?: string }).message ?? '').includes('TOO_MANY') ? t.qa.tooMany : t.qa.failed); }
  }
  return (<section aria-labelledby="ask-title" className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-deep via-navy-dark to-navy p-6 text-white shadow-lift md:p-8">
    <div className="grid-pattern absolute inset-0 opacity-50" aria-hidden="true" /><div className="hero-glow absolute inset-0" aria-hidden="true" />
    <div className="relative">
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-navy-deep shadow-md"><MessageCircleQuestion className="h-6 w-6" /></span>
        <h2 id="ask-title" className="text-2xl text-white">{t.qa.askTitle}</h2></div>
      {state === 'sent' ? (<div className="mt-6 animate-scale-in rounded-2xl bg-white/10 p-6 text-center ring-1 ring-white/15">
        <CheckCircle2 className="mx-auto h-12 w-12 animate-pop text-emerald-300" /><p className="mt-3 font-display text-xl text-white">{t.qa.sentTitle}</p><p className="mt-1 text-slate-200">{t.qa.sentDesc}</p>
        <button type="button" onClick={() => setState('idle')} className="btn-ghost-light btn-sm mt-5">{t.qa.askAnother}</button></div>) : (
        <form onSubmit={onSubmit} className="mt-4">
          <p className="text-slate-200">{t.qa.askDesc}</p>
          <label className="sr-only" htmlFor="ask">{t.qa.askPh}</label>
          <textarea id="ask" value={text} onChange={e => setText(e.target.value)} rows={4} maxLength={1000} placeholder={t.qa.askPh}
            className="mt-4 w-full resize-y rounded-2xl border border-white/20 bg-white/95 p-4 text-ink shadow-inner outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-gold/40" />
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={e => setHp(e.target.value)} name="website" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-300">{t.qa.chars(text.length)}</span>
            <button type="submit" disabled={state === 'sending'} className="btn-gold">{state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{state === 'sending' ? t.qa.sending : t.qa.send}</button></div>
          {err && <p role="alert" className="mt-3 animate-fade-in rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-100 ring-1 ring-red-300/30">{err}</p>}</form>)}</div></section>);
}

export default function QaPage() {
  const { t, lang } = useLang();
  usePageMeta(t.qa.title, t.qa.desc);
  const res = useQuery(FAQ_KEY, fetchFaqs);
  const [q, setQ] = useState(''); const [g, setG] = useState('');
  const chips = [['', t.common.all], ['general', t.qa.general], ['crossword', t.games.crossword], ['a_math', t.games.a_math], ['kumkom', t.games.kumkom], ['sudoku', t.games.sudoku]] as const;
  const rows = useMemo(() => (res.data ?? []).filter(f => (!g || (g === 'general' ? !f.game_type : f.game_type === g))
    && (!q.trim() || `${f.question} ${f.answer} ${f.question_en ?? ''} ${f.answer_en ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [res.data, g, q]);
  return (<><PageHeader title={t.qa.title} desc={t.qa.desc} />
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      <div className="card flex flex-col gap-3 p-3 sm:p-4"><SearchInput value={q} onChange={setQ} placeholder={t.qa.searchPh} />
        <Segmented size="sm" label={t.qa.groupLabel} value={g} onChange={setG} options={chips.map(([value, label]) => ({ value, label }))} /></div>
      <div className="mt-6">{res.error ? <ErrorState onRetry={res.refetch} /> : !res.data ? <LoadingState /> : rows.length === 0 ? <EmptyState text={q || g ? t.qa.emptySearch : t.qa.empty} /> :
        <ul key={`${g}|${q}`} className="stagger space-y-3">{rows.map((f, i) => (<li key={f.id} style={{ ['--i' as string]: i }}><details className="group card overflow-hidden transition open:border-gold/60 open:shadow-lift">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
            <span className="flex gap-3"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy font-display text-sm font-semibold text-gold">Q</span>
              <span className="font-medium text-navy-dark">{f.game_type && <span className="chip mr-2 bg-blue-light align-middle text-navy">{t.games[f.game_type]}</span>}{nb(loc(f, 'question', lang))}</span></span>
            <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-navy transition duration-300 group-open:rotate-180" /></summary>
          <div className="flex animate-slide-down gap-3 border-t border-line bg-gray-light/60 p-5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold font-display text-sm font-semibold text-navy-deep">A</span>
            <div className="whitespace-pre-line text-ink">{nb(loc(f, 'answer', lang))}</div></div></details></li>))}</ul>}</div>
      <AskForm /></div></>);
}
