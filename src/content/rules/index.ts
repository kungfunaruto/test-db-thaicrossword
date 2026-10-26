import { aMath } from './aMath';
import { crossword } from './crossword';
import { kumkom } from './kumkom';
import type { RuleGame } from './types';
export { aMath, crossword, kumkom };
export const RULE_GAMES: RuleGame[] = [crossword, aMath, kumkom];
