// English version of the shared rule sections (translated from ../common.ts; the Thai PDFs remain the official text).
import type { Block, RuleSection } from '../types';
import { cards, h, note, ol, p, table, ul } from '../common';
export { cards, h, note, ol, p, table, ul };

export const timeSection = (rows: string[][]): RuleSection => ({ id: 'time', title: 'Time Control', blocks: [
  table(['Division', 'Time per player'], ...rows),
  ul('A digital clock that shows seconds is used.', 'Exceeding the time limit costs 10 points per minute (any part of a minute counts as a full minute).', 'A player who goes more than 5 minutes into overtime forfeits the game.')] });

export const basics = (minBag: number): RuleSection => ({ id: 'basic', title: 'Basic Rules of Play', blocks: [
  cards(
    { title: 'Scoring', text: 'Both players keep score for themselves and for their opponent. You may ask to check the score at any time during your own turn: tell your opponent and stop the clock. When the check is finished, restart the clock on the side whose turn it is and continue.' },
    { title: 'Tile Exchange', text: `You may exchange any number of tiles, provided at least ${minBag} tiles remain in the bag. You lose your turn and score 0.` },
    { title: 'Pass', text: 'Tell your opponent you are passing, then press the clock. You lose your turn and score 0.' }),
  h('How to exchange tiles'),
  ol('Place the tiles you want to exchange face down on the table and tell your opponent how many you are exchanging.', 'Press the clock to start your opponent’s time.', 'Draw the same number of new tiles from the bag.', 'Only then return the face-down tiles to the bag.'),
  note('If you press the clock to declare an exchange but there are not enough tiles in the bag, it counts as a pass: you score 0 and lose your turn.', 'warn')] });

export const challengeTiming = note('A challenge must be made before any newly drawn tile touches the rack, except when the player has deliberately drawn tiles in a hurry (flash drawing).', 'warn');
export const INVALID = 'The player removes the tiles placed in that turn, scores 0 and loses the turn to the challenger.';

export const endGame = (sixZero: string, extra?: Block): RuleSection => ({ id: 'end', title: 'End of the Game', blocks: [
  p('A game ends in one of three ways.'),
  cards({ title: 'Case 1', text: 'The bag is empty and one player has used all the tiles on their rack.' }, { title: 'Case 2', text: sixZero }, { title: 'Case 3', text: 'One player goes more than 5 minutes into overtime.' }),
  ...(extra ? [extra] : []),
  h('Final scoring'),
  table(['Case', 'Scoring'],
    ['Case 1', 'The player with tiles left doubles the value of each remaining tile and adds the total to the score of the player who went out first.'],
    ['Case 2', 'Each player subtracts the value of the tiles left on their own rack from their own score (not doubled).'],
    ['Case 3', 'Each player subtracts the value of their remaining tiles from their own score (not doubled). The player who exceeded 5 minutes of overtime is then declared the loser and the other player the winner.']),
  h('Win/loss scores in Case 3'),
  p('Scores are calculated after deducting remaining tiles and overtime penalties. Going more than 5 minutes over counts as −50 points.'),
  ul('If the forfeiting player was ahead: the trailing player wins with their own net score, and the loser records the winner’s net score minus 50.',
     'If the forfeiting player was behind: the leading player wins with their own net score, and the loser records their own net score minus 50.',
     'If a score becomes negative after the adjustment, it is raised to 0 and the other player’s score is increased by the same amount.'),
  note('Detailed worked examples are in the full PDF document at the end of this page.')] });

export const conduct = (tool: string, extras: string[] = []): RuleSection => ({ id: 'extra', title: 'Additional Rules', blocks: [ul(...extras,
  'A premium square’s bonus applies only on the turn a new tile is placed on it. Once used, only the face value of the tile counts.',
  'If a single play covers two premium word squares, the word bonus is applied twice (multiplied together).',
  `Players may not ${tool} during the game.`,
  'A player who does not appear within 15 minutes of the official start time forfeits the game.',
  'Overdraw: put all drawn tiles together with the tiles on the rack and tell your opponent. The opponent then picks X+2 tiles from them, chooses which extra tiles go back into the bag, and returns them.',
  'Hold: may be requested before the player who made the play draws new tiles. A hold may last as long as needed, but the clock of the player holding keeps running. After 30 seconds of hold, the other player may draw new tiles but must keep them clearly separate from the rack. The player holding must then say whether or not they challenge.',
  'For anything not covered here, WESPA Rules Version 5.1 apply. Where the rules are silent, the referee decides.',
  'The decision of the tournament committee is final.')] });
