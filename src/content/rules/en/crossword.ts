import type { RuleGame } from '../types';
import { basics, cards, challengeTiming, conduct, endGame, h, INVALID, note, ol, p, table, timeSection } from './common';
export const crossword: RuleGame = {
  slug: 'crossword', gameType: 'crossword', title: 'Crossword Rules', name: 'Crossword', brand: 'Wordsmith Crossword Game', version: 'Ver.16/6/2026', accent: '#1F7A8C',
  tagline: 'An English word game: combine letter tiles into words and connect them on the board crossword-style.',
  pdf: { url: '/rules/Tournament_Rules_Crossword_3_2025.pdf', label: 'Standard Tournament Rules for the Wordsmith Crossword Game, Bangkok Crossword Club (Thai)' },
  facts: [
    { icon: 'users', label: 'Players', value: '2', sub: 'up to 4' }, { icon: 'grid', label: 'Board', value: '15 × 15', sub: '225 squares' },
    { icon: 'tiles', label: 'Tiles', value: '100', sub: 'A–Z 98 + 2 blanks' }, { icon: 'clock', label: 'Time', value: '25 min', sub: 'per player (primary 20 min)' },
    { icon: 'hand', label: 'Rack', value: '7 tiles', sub: 'drawn at the start' }, { icon: 'star', label: 'Bingo bonus', value: '+50', sub: 'all 7 tiles in one turn' }],
  sections: [
    { id: 'intro', title: 'What is this game?', blocks: [
      p('Wordsmith Crossword Game is the name of an English word game widely known as SCRABBLE™ or the Crossword Game. It can be played by 2–4 players, but tournament games are normally played by two.'),
      p('Players use the letter tiles on their rack to form words and place them on the board crossword-style, choosing positions that make the most of letter values and premium squares. The aim is the highest total score. A game typically scores from about 100 to 400 points or more, depending on the players’ skill.')] },
    { id: 'equipment', title: 'Equipment', blocks: [
      cards({ title: 'Board', text: 'A grid of 15 × 15 squares (225 in total) with premium squares that give different bonuses.' },
        { title: 'Letter tiles', text: '100 tiles: 98 letters A–Z and 2 blanks. The point value is printed in the lower-right corner. A blank can stand for any letter, is worth zero points and keeps the declared letter until the end of the game.' },
        { title: 'Rack', text: 'Holds and arranges your tiles while you look for words. Your opponent must always be able to see clearly how many tiles you have.' },
        { title: 'Dictionary', text: 'Since 1 January 2026 the Bangkok Crossword Club officially uses Collins Official SCRABBLE™ Words (8th Edition), 2024.' }),
      h('Premium squares'),
      cards({ title: 'Light blue (Double Letter Score)', text: 'The letter placed here scores ×2', color: '#8CC4EE' }, { title: 'Dark blue (Triple Letter Score)', text: 'The letter placed here scores ×3', color: '#2E78B7' },
        { title: 'Pink (Double Word Score)', text: 'The whole word scores ×2', color: '#F4A6A0' }, { title: 'Red (Triple Word Score)', text: 'The whole word scores ×3', color: '#E5472F' }),
      note('The primary-school division uses only 70 tiles to make the game easier.', 'warn')] },
    timeSection([['Secondary to open', '25 minutes'], ['Primary', '20 minutes']]),
    { id: 'before', title: 'Before the Game', blocks: [
      ol('Have a pen and score sheet ready.', 'Place the board midway between the two players.', 'Each player takes one rack and places it in front of themselves only.',
        'Check that all tiles are present, then put them all in the bag.', 'Each player draws one tile. The player whose letter is closest to A goes first; a blank always goes first. If both draw the same letter, draw again.', 'Return the drawn tiles to the bag and shake it.'),
      note('In some tournaments, the pairing software decides who goes first.')] },
    { id: 'start', title: 'Starting the Game', blocks: [
      ol('The first player draws 7 tiles from the bag onto their rack, and the other player does the same.', 'Once the first tile has been drawn, the second player starts the first player’s clock.',
        'The first player forms a word of at least 2 letters and places it in a single horizontal or vertical line (never diagonally), with at least one tile on the centre star.',
        'After placing the word, the player counts the score aloud so the opponent can hear, records it and presses the clock. This completes the turn.', 'The player then draws as many new tiles as were played, or until the bag is empty.')] },
    basics(7),
    { id: 'challenge', title: 'Challenging Words', blocks: [
      p('After a player places a word, announces the score and presses the clock, the opponent may challenge the words just formed by saying “challenge” and stating how many and which words to check. Both players go to the computer together to check all challenged words at once.'),
      p('There are several challenge rules; which one applies depends on the division and type of tournament.'),
      table(['Rule', 'Used in', 'If the word is valid', 'If the word is not valid'],
        ['Free / Single Challenge', 'Wordsmith primary division only', 'The challenger does not lose a turn; play continues normally', INVALID],
        ['Double Challenge', '—', 'The challenger loses their turn; the player continues', INVALID],
        ['5-Point Penalty Per Word', 'Wordsmith secondary and open divisions', 'The challenger gives 5 points per challenged word to the player (added to the normal score)', INVALID],
        ['5-Point Penalty Per Challenge', 'Wordsmith online', 'The challenger gives 5 points per challenge, regardless of the number of words (added to the normal score)', INVALID]),
      challengeTiming] },
    { id: 'bingo', title: 'Bingo Bonus', blocks: [p('A player who uses all 7 tiles from the rack in one turn earns a 50-point bonus on top of the normal score.')] },
    { id: 'turn', title: 'Later Turns and 5 Ways to Form Words', blocks: [
      p('On each later turn a player may exchange tiles, pass, or place tiles from the rack to form a new word of at least 2 letters. Tiles must be placed in one horizontal or vertical line, reading left to right or top to bottom. Any tiles touching other tiles must form complete words crossword-style, and the player scores every new word formed in that turn.'),
      cards({ title: '1. Extend a word', text: 'Add a tile to the beginning or end of a word already on the board, or to both ends.' },
        { title: '2. Cross a word', text: 'Place a word at right angles to a word on the board, using one letter that is already there.' },
        { title: '3. Play in parallel', text: 'Place a word parallel to a word on the board, forming more than one new word in a single turn and scoring all of them.' },
        { title: '4. Make a new word', text: 'Add letters to a word on the board so that it becomes a different word.' },
        { title: '5. Bridge', text: 'Connect two or more letters already on the board. This is possible from the 4th turn onwards.' })] },
    endGame('Both players fail to score three times in a row each (SIX-ZERO Rule).'),
    conduct('consult a dictionary or any other aid', ['Tiles touching other tiles in the same line must form words crossword-style.', 'The same word may be played more than once, and plurals are allowed.',
      'A word may be extended at both ends in one turn, e.g. TRAIN to STRAINER.', 'All tiles played in one turn must be in one continuous line, horizontal or vertical.', 'A blank placed on a Double or Triple Word square still doubles or triples the whole word.'])],
};
