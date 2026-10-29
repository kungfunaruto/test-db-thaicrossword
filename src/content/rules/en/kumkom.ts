import type { RuleGame } from '../types';
import { basics, cards, challengeTiming, conduct, endGame, h, INVALID, note, ol, p, table, timeSection } from './common';
export const kumkom: RuleGame = {
  slug: 'kumkom', gameType: 'kumkom', title: 'Kumkom Rules', name: 'Kumkom', brand: 'Thaismith Thai Language Game', version: 'Ver.1/6/2026', accent: '#C81D4E',
  tagline: 'A Thai word game: combine consonant and vowel tiles into Thai words and connect them on the board crossword-style.',
  pdf: { url: '/rules/Tournament_Rules_Thaismith_2_2025.pdf', label: 'Standard Tournament Rules for the Thaismith Thai Language Game, Bangkok Crossword Club (Thai)' },
  facts: [
    { icon: 'users', label: 'Players', value: '2', sub: 'up to 4' }, { icon: 'grid', label: 'Board', value: '19 × 15', sub: '285 squares' },
    { icon: 'tiles', label: 'Tiles', value: '104', sub: 'consonants, vowels and blanks' }, { icon: 'clock', label: 'Time', value: '22 min', sub: 'per player' },
    { icon: 'hand', label: 'Rack', value: '9 tiles', sub: 'drawn at the start' }, { icon: 'star', label: 'Bingo bonus', value: '40–90', sub: '6–9 tiles in one turn' }],
  sections: [
    { id: 'intro', title: 'What is this game?', blocks: [
      p('Thaismith Thai Language Game (Kumkom) is the name of a Thai word game for 2–4 players; tournament games are normally played by two. It adapts the English crossword word game to the Thai language and is a registered trademark under the name “Thaismith”.'),
      p('Players use the consonant and vowel tiles on their rack to form words and place them on the board crossword-style, choosing positions that make the most of letter values and premium squares. The aim is the highest total score. A game typically scores from about 100 to 400 points or more, depending on the players’ skill.')] },
    { id: 'equipment', title: 'Equipment', blocks: [
      cards({ title: 'Board', text: 'A grid of 19 × 15 squares (285 in total), with large and small squares for consonants and for vowels and tone marks, plus several types of premium square.' },
        { title: 'Letter tiles', text: '104 tiles: the Thai consonants ก–ฮ, Thai vowels and blanks.' },
        { title: 'Paper vowel tiles', text: 'Besides the plastic tiles, there are paper vowels that may be used at any time to complete a valid word.' },
        { title: 'Rack', text: 'Holds and arranges your tiles while you look for words. Your opponent must always be able to see clearly how many tiles you have.' },
        { title: 'Word list', text: 'Based on the association’s word book, compiled from the Royal Institute Dictionary B.E. 2554 (2011) and other sources. Valid words are those accepted by the association’s word-checking application.' }),
      h('6 types of premium square'),
      cards({ title: 'Blue', text: 'Letter ×2', color: '#1E88E5' }, { title: 'Green', text: 'Letter ×3', color: '#2EAD5A' }, { title: 'Orange', text: 'Letter ×4', color: '#F28C28' },
        { title: 'Purple', text: 'Letter ×5', color: '#7B4B9A' }, { title: 'Pink', text: 'Whole word ×2', color: '#E85DA0' }, { title: 'Red', text: 'Whole word ×3', color: '#E0243B' })] },
    timeSection([['Students to open', '22 minutes']]),
    { id: 'before', title: 'Before the Game', blocks: [
      ol('Have a pen and score sheet ready.', 'Place the board midway between the two players.', 'Each player takes one rack and places it in front of themselves only.',
        'Check that all tiles are present, then put them all in the bag.',
        'Each player draws one tile. The order is: a blank first, then ก to ฮ (for a tile with two letters, use the better-ranked letter); all vowels rank last. If both draw the same, draw again.', 'Return the drawn tiles to the bag and shake it.'),
      note('In some tournaments, the pairing software decides who goes first.')] },
    { id: 'start', title: 'Starting the Game', blocks: [
      ol('The first player draws 9 tiles from the bag onto their rack, and the other player does the same.', 'Once the first tile has been drawn, the second player starts the first player’s clock.',
        'The first player forms a valid Thai word of at least 2 letters and places it in a single horizontal or vertical line (never diagonally), with at least one tile on the centre star.',
        'After placing the word, the player counts the score aloud so the opponent can hear, records it and presses the clock. This completes the turn.', 'The player then draws as many new tiles as were played, or until the bag is empty.'),
      note('The centre star is a pink premium square, so the first word scores double. Paper vowels may be used to help form words on every turn.')] },
    basics(9),
    { id: 'challenge', title: 'Challenging Words', blocks: [
      p('After a player places a word, announces the score and presses the clock, the opponent may challenge the words just formed by saying “challenge” and stating how many and which words to check. Both players go to the computer together to check all challenged words at once.'),
      table(['Case', 'Result'], ['The word is in the word list', 'The challenger loses their turn; the player continues.'], ['The word is not in the word list', INVALID]),
      challengeTiming] },
    { id: 'bingo', title: 'Bingo Bonus', blocks: [
      p('A player who uses 6 to 9 plastic letter tiles from their own rack to form a word in a single turn earns a bonus on top of the normal score:'),
      table(['Tiles played from the rack', 'Bonus'], ['6 letters', '40 points'], ['7 letters', '50 points'], ['8 letters', '70 points'], ['9 letters', '90 points'])] },
    { id: 'turn', title: 'Later Turns and 5 Ways to Form Words', blocks: [
      p('On each later turn a player may exchange tiles, pass, or place tiles from the rack to form a new word of at least 2 letters. Tiles must be placed in one horizontal or vertical line, reading left to right or top to bottom. Any tiles touching other tiles must form complete words crossword-style, and the player scores every new word formed in that turn.'),
      cards({ title: 'Method 1: extend in the same line', text: 'Add one or more letters to a word or letter on the board to make a new word in the same line. Tone marks may not be added above or below an existing word. Example: พารา becomes พาราฟิน.' },
        { title: 'Method 2: borrow a letter', text: 'Use one letter of a word on the board to play a new word in the other direction. Example: play กรอง using the ร already on the board.' },
        { title: 'Method 3: form several words at once', text: 'Play a word horizontally or vertically so that its letters touch or extend words on the board, creating new words with new meanings. Example: play อก, so that อ also forms อร and ก forms กา, giving three new words: อก, อร and กา.' },
        { title: 'Method 4: replace one letter', text: 'Play a word in which one letter replaces a single letter of a word on the board, turning it into a new word; both words score (only one letter may be replaced). Example: player 1 plays ทรง; player 2 plays กราบ and lifts the ร from the board, forming two new words: กราบ and ทาง.' },
        { title: 'Method 5: add before or after a word', text: 'Play in front of or after a word on the board so that it becomes a new word; both words score. Example: player 1 plays หวา; player 2 plays สนอง with its น after หวา, making หวาน: two new words, สนอง and หวาน.' })] },
    endGame('Both players fail to score three times in a row each (SIX-ZERO Rule): play returns to the centre of the board. If it happens a second time, the game ends.'),
    conduct('consult a dictionary or any other aid', ['Any tile touching another tile in the same line must form a word crossword-style.', 'The same word may be played more than once.',
      'A word may be extended at both ends in one turn, e.g. นา to อนาถ.', 'All tiles played in one turn must be in one continuous line, horizontal or vertical.'])],
};
