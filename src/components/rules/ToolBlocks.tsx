import { Download, ExternalLink, Hourglass, Monitor } from 'lucide-react';
import { collins, kumkomExe } from '../../content/rules/tools';
import { useLang } from '../../i18n';
import WordChecker from './WordChecker';

const Card = ({ accent, title, children }: { accent: string; title: string; children: React.ReactNode }) => (
  <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-card"><div className="h-1.5" style={{ background: accent }} />
    <div className="p-5"><h4 className="flex items-center gap-2 font-sans text-lg font-semibold text-navy"><Monitor className="h-5 w-5" />{title}</h4>{children}</div></div>);

export default function ToolBlock({ tool, accent }: { tool: 'crossword-challenge' | 'kumkom-challenge' | 'checker-en' | 'checker-th'; accent: string }) {
  const { t } = useLang(); const x = t.tools;
  if (tool === 'checker-en') return <WordChecker lang="en" />;
  if (tool === 'checker-th') return <WordChecker lang="th" />;
  if (tool === 'crossword-challenge') return (<Card accent={accent} title={x.collinsTitle}>
    <p className="mt-3">{x.collinsText}</p>
    <a href={collins.tools} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4"><Download className="h-4 w-4" />{x.collinsBtn}<ExternalLink className="h-4 w-4" /></a>
    <p className="mt-3 text-xs text-muted">{x.collinsNote}</p></Card>);
  return (<Card accent={accent} title={x.kumkomTitle}>
    <p className="mt-3">{x.kumkomText}</p>
    {kumkomExe.available
      ? <a href={kumkomExe.url} download={kumkomExe.fileName} className="btn-primary mt-4"><Download className="h-4 w-4" />{x.download} {kumkomExe.fileName}{kumkomExe.sizeLabel && ` (${kumkomExe.sizeLabel})`}</a>
      : <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><Hourglass className="mt-0.5 h-4 w-4 shrink-0" />{x.preparing}</p>}
    <h5 className="mt-5 font-sans font-semibold text-navy-dark">{x.howTo}</h5>
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{x.steps.map(s => <li key={s}>{s}</li>)}</ol>
    <p className="mt-3 text-xs text-muted">{x.winNote}</p></Card>);
}
