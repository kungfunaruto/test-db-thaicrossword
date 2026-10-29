import { useParams } from 'react-router-dom';
import { Building2, CalendarClock, CalendarDays, Download, ExternalLink, Gamepad2, MapPin, type LucideIcon } from 'lucide-react';
import { competitionStatus, eventDetailKey, fetchEventDetail } from '../services/publicService';
import { useQuery } from '../lib/query';
import { usePageMeta } from '../hooks/usePublic';
import { loc, useLang } from '../i18n';
import { nb } from '../utils/labels';
import { bangkokToday, daysBetween, fmtDate, fmtRange } from '../lib/dates';
import { GameChips, StatusBadge } from '../components/events/EventCard';
import Gallery from '../components/common/Gallery';
import EditedBadge from '../components/common/EditedBadge';
import ShareButtons from '../components/common/ShareButtons';
import { EmptyState, ErrorState } from '../components/common/States';
import BackLink from '../components/common/BackLink';

const Info = ({ Icon, label, children }: { Icon: LucideIcon; label: string; children: React.ReactNode }) => (
  <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-light text-navy"><Icon className="h-5 w-5" /></span>
    <div className="min-w-0"><p className="text-xs text-muted">{label}</p><div className="font-medium text-navy-dark">{children}</div></div></div>);

export default function EventDetailPage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const q = useQuery(eventDetailKey(id), () => fetchEventDetail(id));
  const e = q.data?.event;
  const title = loc(e, 'title', lang), venue = loc(e, 'venue', lang), desc = loc(e, 'description', lang), organizer = loc(e, 'organizer', lang);
  usePageMeta(title, desc, e?.images[0]);
  const back = <BackLink to="/events" label={t.events.backToList} />;
  if (q.error) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">{back}<ErrorState onRetry={q.refetch} /></div>;
  if (q.data === undefined) return (<div className="mx-auto max-w-6xl px-4 py-10" aria-hidden="true"><div className="skeleton h-5 w-40" /><div className="skeleton mt-6 h-10 w-2/3" />
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]"><div className="skeleton aspect-[16/10] rounded-2xl" /><div className="skeleton h-72 rounded-2xl" /></div></div>);
  if (!e) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10"><EmptyState text={t.events.notFound} />{back}</div>;
  const d = q.data!;
  const today = bangkokToday(); const s = competitionStatus(e, today);
  // registration progress: from the day the competition was added until registration closes (only when it takes registrations)
  const deadline = e.registration_deadline;
  const total = deadline ? Math.max(1, daysBetween(e.created_at.slice(0, 10), deadline)) : 1; const left = deadline ? daysBetween(today, deadline) : 0;
  const pct = Math.min(100, Math.max(4, ((total - left) / total) * 100));
  const links: [string | null, string, boolean][] = [[e.result_url, t.events.result, false], [e.teacher_certificate_url, t.events.teacherCert, true], [e.student_certificate_url, t.events.studentCert, true]];
  const docs = links.filter(([u]) => u);
  return (<article className="mx-auto max-w-6xl px-4 py-8 md:py-10">
    {back}
    <header className="mt-6 max-w-4xl animate-fade-up">
      <div className="flex flex-wrap items-center gap-2"><StatusBadge s={s} className="text-sm" /><GameChips games={e.games} /><EditedBadge revisions={d.revisions} /></div>
      <h1 className="mt-4 text-3xl leading-[1.35] md:text-[2.6rem] md:leading-[1.3]">{nb(title)}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmtRange(e.start_date, e.end_date, lang)}</span>
        {venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{nb(venue)}</span>}
        {organizer && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{nb(organizer)}</span>}</p></header>
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 animate-fade-up space-y-8" style={{ animationDelay: '80ms' }}>
        <Gallery images={e.images} alt={title} />
        <section className="card p-6 md:p-8"><h2 className="mb-4 text-xl">{t.events.details}</h2><div className="prose-th">{nb(desc)}</div>
          <div className="mt-8 border-t border-line pt-5"><ShareButtons title={title} /></div></section></div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <section className="card overflow-hidden">
          {s === 'open' && <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4 text-white">
            <p className="text-sm text-white/85">{t.events.deadline} {fmtDate(deadline, lang)}</p><p className="font-display text-2xl font-medium">{t.events.daysLeft(left)}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full origin-left animate-[fade-in_.6s_ease] rounded-full bg-white" style={{ width: `${pct}%` }} /></div></div>}
          {(s === 'closed' || s === 'upcoming') && <div className={`bg-gradient-to-r px-5 py-4 text-white ${s === 'closed' ? 'from-amber-500 to-orange-500' : 'from-navy to-navy-soft'}`}><p className="text-sm text-white/85">{t.events.status[s]}</p>
            <p className="font-display text-2xl font-medium">{t.events.startsIn(Math.max(0, daysBetween(today, e.start_date)))}</p></div>}
          <div className="space-y-4 p-5"><h2 className="font-sans text-base font-semibold">{t.events.info}</h2>
            <Info Icon={CalendarDays} label={t.events.date}>{fmtRange(e.start_date, e.end_date, lang)}</Info>
            {deadline && <Info Icon={CalendarClock} label={t.events.deadline}>{fmtDate(deadline, lang)}</Info>}
            {venue && <Info Icon={MapPin} label={t.events.venue}>{nb(venue)}</Info>}
            {organizer && <Info Icon={Building2} label={t.events.organizer}>{nb(organizer)}</Info>}
            {e.games.length > 0 && <Info Icon={Gamepad2} label={t.events.games}><span className="mt-1 flex flex-wrap gap-1"><GameChips games={e.games} /></span></Info>}</div></section>
        {docs.length > 0 && <section className="card space-y-2 p-5"><h2 className="mb-2 font-sans text-base font-semibold">{t.events.documents}</h2>
          {docs.map(([u, label, dl]) => <a key={label} href={u!} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-navy transition hover:border-gold hover:bg-gold/5">
            {dl ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}{label}</a>)}</section>}
      </aside></div>
  </article>);
}
