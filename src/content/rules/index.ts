import { aMath as aMathRaw } from './aMath';
import { crossword as crosswordRaw } from './crossword';
import { kumkom as kumkomRaw } from './kumkom';
import { formatsSection } from './formats';
import { toolsSection } from './tools';
import type { RuleGame, RuleSection } from './types';
const insertAfter = (g: RuleGame, id: string, s: RuleSection): RuleGame => {
  const i = g.sections.findIndex(x => x.id === id); if (i < 0) throw new Error(`section ${id} not found in ${g.slug}`);
  const sections = [...g.sections]; sections.splice(i + 1, 0, s); return { ...g, sections };
};
// Challenge tools go right after "Challenge"; competition formats go right after the how-to-play sections (after "End game").
export const crossword = insertAfter(insertAfter(crosswordRaw, 'challenge', toolsSection('crossword')), 'end', formatsSection);
export const aMath = insertAfter(aMathRaw, 'end', formatsSection);
export const kumkom = insertAfter(insertAfter(kumkomRaw, 'challenge', toolsSection('kumkom')), 'end', formatsSection);
export const RULE_GAMES: RuleGame[] = [crossword, aMath, kumkom];
