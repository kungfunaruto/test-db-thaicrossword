import type { RuleGame } from '../types';
import { basics, cards, challengeTiming, conduct, endGame, h, note, ol, p, table, timeSection } from './common';
export const aMath: RuleGame = {
  slug: 'a-math', gameType: 'a_math', title: 'A-Math Rules', name: 'A-Math', brand: 'Mathsmith Mathematics Game', version: 'Ver.4/2025', accent: '#1E3A8A',
  tagline: 'An equation-building game: use number and operator tiles to make correct equations. No vocabulary to memorise, just a solid understanding of mathematics.',
  pdf: { url: '/rules/Tournament_Rules_Mathsmith_4_2025.pdf', label: 'Standard Tournament Rules for the Mathsmith Mathematics Game, Bangkok Crossword Club (Thai)' },
  facts: [
    { icon: 'users', label: 'Players', value: '2', sub: 'up to 4' }, { icon: 'grid', label: 'Board', value: '15 × 15', sub: '225 squares' },
    { icon: 'tiles', label: 'Tiles', value: '100', sub: '60 numbers + 36 operators + 4 blanks' }, { icon: 'clock', label: 'Time', value: '22 min', sub: 'per player (primary 20 min)' },
    { icon: 'hand', label: 'Rack', value: '8 tiles', sub: 'drawn at the start' }, { icon: 'star', label: 'Bingo bonus', value: '+40', sub: 'all 8 tiles in one turn' }],
  sections: [
    { id: 'intro', title: 'What is this game?', blocks: [
      p('Mathsmith Mathematics Game is the name of an equation-building game for 2–4 players; tournament games are normally played by two. Players use number tiles and the plus, minus, multiply, divide and equals signs, each with its own point value, to build correct equations on the board.'),
      p('The aim is the highest total score, by choosing positions that make the best use of tile values and premium squares, extending equations and building equations with fractions. A game typically scores from about 100 to 400 points or more, depending on the players’ skill.')] },
    { id: 'equipment', title: 'Equipment', blocks: [
      cards({ title: 'Board', text: 'A grid of 15 × 15 squares (225 in total) with premium squares that give different bonuses.' },
        { title: 'Number and operator tiles', text: '100 tiles: 60 numbers from 0 to 20, 36 operators (plus, minus, multiply, divide, equals) and 4 blanks. The point value is printed in the lower-right corner.' },
        { title: 'Blank', text: 'Stands for any number or operator used in the game, is worth zero points and keeps the declared value until the end of the game.' },
        { title: 'Rack', text: 'Holds and arranges your tiles while you look for equations. Your opponent must always be able to see clearly how many tiles you have.' }),
      h('Premium squares'),
      cards({ title: 'Pink (Double 2X Piece)', text: 'The number or operator placed here scores ×2', color: '#F4A28C' }, { title: 'Blue (Triple 3X Piece)', text: 'The number or operator placed here scores ×3', color: '#5BA3D9' },
        { title: 'Yellow (Double 2X Equation)', text: 'The whole equation scores ×2', color: '#FBC02D' }, { title: 'Red (Triple 3X Equation)', text: 'The whole equation scores ×3', color: '#E53935' }),
      note('The primary-school division uses only 70 tiles to make the game easier.', 'warn')] },
    timeSection([['Secondary to open', '22 minutes'], ['Primary', '20 minutes']]),
    { id: 'before', title: 'Before the Game', blocks: [
      ol('Have a pen and score sheet ready.', 'Place the board midway between the two players.', 'Each player takes one rack and places it in front of themselves only.',
        'Check that all tiles are present, then put them all in the bag.',
        'Each player draws one tile. The player whose tile is closest to 20 goes first. Operators count as lower than 0 and are all equal. A blank always goes first. If both draw the same tile, draw again.', 'Return the drawn tiles to the bag and shake it.'),
      note('In some tournaments, the pairing software decides who goes first.')] },
    { id: 'start', title: 'Starting the Game', blocks: [
      ol('The first player draws 8 tiles from the bag onto their rack, and the other player does the same.', 'Once the first tile has been drawn, the second player starts the first player’s clock.',
        'The first player forms an equation of at least 3 tiles and places it in a single horizontal or vertical line (never diagonally), with at least one tile on the centre star.',
        'After placing the equation, the player counts the score aloud so the opponent can hear, records it and presses the clock. This completes the turn.', 'The player then draws as many new tiles as were played, or until the bag is empty.')] },
    basics(5),
    { id: 'math', title: 'Calculation Rules', blocks: [
      p('Every equation on the board must be mathematically correct, reading left to right or top to bottom. The key principles are:'),
      table(['Topic', 'Rule', 'Example'],
        ['Order of operations', 'Multiplication and division come before addition and subtraction (as if they were in brackets); then calculate from left to right.', '6 + 6 × 3 = 24 (not 36)\n5 + 16 ÷ 4 × 2 = 13'],
        ['Division by zero', '0 may never be a divisor, but it may be divided; the result is always 0.', '0 ÷ 15 = 0 is valid\n15 ÷ 0 is not valid'],
        ['Fractions', 'Equations may be written with fractions.', '5 ÷ 6 = 10 ÷ 12'],
        ['Multi-digit numbers', 'Two or three single-digit tiles (0–9) may be placed side by side to form a 2- or 3-digit number (up to hundreds).', '1 and 2 as 12 is valid\n1 and 15 as 115 is not valid'],
        ['Negative numbers', 'A minus sign may be placed before a number tile (1–20) or a combined number to make it negative, but plus, minus, multiply and divide signs may not be placed next to each other.', '−7 − 7 = −14 is valid\n6 + − 3 = 3 is not valid'],
        ['Leading zeros', '0 may not be placed in front of any number.', '09 and 012 are not valid'],
        ['Signed zero', 'Zero may not take a + or − sign.', '+0 = 7 − 7 is not valid'])] },
    { id: 'challenge', title: 'Challenging Equations', blocks: [
      p('After a player places an equation, announces the score and presses the clock, the opponent may challenge the equations just formed by saying “challenge” and stating which equations to check. Both players raise a hand or call the division referee to check all challenged equations at once.'),
      h('Double Challenge'),
      table(['Case', 'Result'],
        ['The equation is mathematically correct', 'The challenger loses their turn; the player continues.'],
        ['The equation is not correct', 'The player removes the tiles placed in that turn, scores 0 and loses the turn to the challenger.']),
      challengeTiming] },
    { id: 'bingo', title: 'Bingo Bonus', blocks: [p('A player who uses all 8 tiles from the rack in one turn earns a 40-point bonus on top of the normal score.')] },
    { id: 'turn', title: 'Later Turns and 6 Ways to Build Equations', blocks: [
      p('On each later turn a player may exchange tiles, pass, or place tiles from the rack to form a correct equation in one horizontal or vertical line. Any tiles touching other tiles must also form complete equations, and the player scores every new equation formed in that turn.'),
      cards({ title: '1. A new equation from the rack', text: 'Build a new equation of at least 3 tiles from your rack (first turn only).' },
        { title: '2. Combine with board tiles', text: 'Build a new equation using tiles already on the board together with tiles from your rack.' },
        { title: '3. Make at least 2 equations', text: 'Build a new equation from your rack while at least one tile also extends an existing equation on the board correctly.' },
        { title: '4. Extend, same result (no =)', text: 'Extend an existing equation so that its result stays the same, without adding an = sign.' },
        { title: '5. Extend, same result (with =)', text: 'Extend an existing equation so that its result stays the same, adding an = sign, e.g. 5 + 16 ÷ 4 × 2 = 13 becomes 5 + 16 ÷ 4 × 2 = 13 = 65 ÷ 5.' },
        { title: '6. Extend, different result', text: 'Extend an existing equation so that it gives a different result.' })] },
    endGame('Both players fail to score three times in a row each (SIX-ZERO Rule).', note('Exception at the start of a game before anyone has scored: after 6 consecutive scoreless turns the players agree whether to continue. If they agree, play continues normally; if either player does not agree, all tiles go back into the bag and the draw starts again.', 'warn')),
    conduct('use a calculator or any other aid', ['A blank placed on a Double or Triple Equation square still doubles or triples the whole equation.'])],
};
