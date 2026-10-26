import { Link, useParams } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { fetchEventById } from '../services/publicService';
import { useAsync, usePageMeta } from '../hooks/usePublic';
import { StatusBadge } from '../components/events/EventCard';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import { nb, GAME_LABEL, dateRange } from '../utils/labels';
export default function EventDetailPage() {
  const { id = '' } = useParams();
  const { data, error } = useAsync(async () => ({ e: await fetchEventById(id) }), [id]);
  const e = data?.e;
  usePageMeta(e?.title ?? '', e?.description, e?.image_url);
  const back = <Link to="/events" className="text-navy underline">← กลับไปหน้ากิจกรรม</Link>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState /></div>;
  if (!data) return <LoadingState />;
  if (!e) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10"><EmptyState text="ไม่พบกิจกรรมที่ต้องการ" />{back}</div>;
  const links: [string | null, string, boolean][] = [[e.result_url, 'ดูผลการแข่งขัน', false], [e.teacher_certificate_url, 'ดาวน์โหลดเกียรติบัตรครู', true], [e.student_certificate_url, 'ดาวน์โหลดเกียรติบัตรนักเรียน', true]];
  return (<article className="mx-auto max-w-3xl px-4 py-10">{back}
    {e.image_url && <img src={e.image_url} alt={e.title} className="mt-6 w-full rounded" />}
    <div className="mt-6 flex items-center gap-3"><StatusBadge s={e.competition_status} /><span className="text-sm text-muted">{GAME_LABEL[e.game_type] ?? e.game_type}</span></div>
    <h1 className="mt-2 text-3xl">{nb(e.title)}</h1><p className="mt-1 text-muted">{dateRange(e.start_date, e.end_date)}{e.venue ? ` · ${e.venue}` : ''}</p>
    <div className="mt-6 whitespace-pre-line leading-8">{nb(e.description)}</div>
    <div className="mt-8 flex flex-wrap gap-3">{links.filter(([u]) => u).map(([u, t, dl]) =>
      <a key={t} href={u!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded bg-navy px-5 py-2.5 text-white">{dl ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}{t}</a>)}</div>
  </article>);
}
