import { aMath as thAMath } from './aMath';
import { crossword as thCrossword } from './crossword';
import { kumkom as thKumkom } from './kumkom';
import { formatsSection as thFormats } from './formats';
import { aMath as enAMath } from './en/aMath';
import { crossword as enCrossword } from './en/crossword';
import { kumkom as enKumkom } from './en/kumkom';
import { formatsSection as enFormats } from './en/formats';
import type { RuleGame, RuleSection } from './types';
import type { Lang } from '../../i18n';

const toolsSection = (kind: 'crossword' | 'kumkom', lang: Lang): RuleSection => ({
  id: 'tools', title: lang === 'th' ? 'โปรแกรม Challenge และตัวตรวจคำ' : 'Challenge Programs and Word Checkers',
  blocks: [{ t: 'tool', tool: kind === 'crossword' ? 'crossword-challenge' : 'kumkom-challenge' }, { t: 'h', text: lang === 'th' ? 'ตรวจคำบนเว็บไซต์' : 'Check a word online' },
    { t: 'tool', tool: kind === 'crossword' ? 'checker-en' : 'checker-th' }] });
const insertAfter = (g: RuleGame, id: string, s: RuleSection): RuleGame => {
  const i = g.sections.findIndex(x => x.id === id); if (i < 0) throw new Error(`section ${id} not found in ${g.slug}`);
  const sections = [...g.sections]; sections.splice(i + 1, 0, s); return { ...g, sections };
};
// Challenge tools go right after "Challenge". Competition formats are NOT inside each game: they are shown once, at the end of /games.
const build = (lang: Lang, cw: RuleGame, am: RuleGame, kk: RuleGame) => [insertAfter(cw, 'challenge', toolsSection('crossword', lang)), am, insertAfter(kk, 'challenge', toolsSection('kumkom', lang))];
export const RULE_GAMES: Record<Lang, RuleGame[]> = { th: build('th', thCrossword, thAMath, thKumkom), en: build('en', enCrossword, enAMath, enKumkom) };
export const FORMATS: Record<Lang, RuleSection> = { th: thFormats, en: enFormats };
