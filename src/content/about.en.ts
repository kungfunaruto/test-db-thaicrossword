// English version of ./about.ts (same sources; unverified items stay in `pending`).
import { timeline as thTimeline, type Milestone } from './about';
const tl = (i: number, title: string, text: string): Milestone => ({ ...thTimeline[i], title, text });
export const sources = [
  { id: 'logo', label: 'Official emblem of the association (file supplied by the association)', url: '/logo/tca-logo.jpg' },
  { id: 'rules', label: 'Standard tournament rules (Bangkok Crossword Club): PDF documents on this website', url: '/games' },
  { id: 'gamesmith', label: 'The Thai Press (2026): B.Grimm Gamesmith, competing for the Royal Trophy', url: 'https://www.thethaipress.com/2026/166901' },
  { id: 'ryt9-2011', label: 'RYT9 (2011): Cyberdict Crossword Game Northern Championship', url: 'https://www.ryt9.com/s/prg/1060469' },
  { id: 'sanook-2010', label: 'Sanook Campus (2010): Cyberdict partners with the association', url: 'https://www.sanook.com/campus/924646/' },
  { id: 'newswit', label: 'Newswit: press releases mentioning the association (2016–2026)', url: 'https://www.newswit.com/search?q=%E0%B8%AA%E0%B8%A1%E0%B8%B2%E0%B8%84%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%AD%E0%B8%AA%E0%B9%80%E0%B8%A7%E0%B8%B4%E0%B8%A3%E0%B9%8C%E0%B8%94&source=pr' },
  { id: 'fb', label: 'The association’s Facebook page', url: 'https://www.facebook.com/tthailandcrossword' },
];
export const games = [
  { name: 'Crossword', brand: 'Wordsmith Crossword Game', text: 'An English word game: combine letter tiles into words on a crossword-style board.', to: '/games/crossword' },
  { name: 'A-Math', brand: 'Mathsmith Mathematics Game', text: 'An equation game: use number and operator tiles to build correct equations.', to: '/games/a-math' },
  { name: 'Kumkom', brand: 'Thaismith Thai Language Game', text: 'A Thai word game: combine consonant and vowel tiles into words on the board.', to: '/games/kumkom' },
  { name: 'Sudoku', brand: 'Sudoku', text: 'A number-logic puzzle that appears as one of the competition categories at events co-organised by the association.', to: '' }];
export const doing = [
  { title: 'Co-organising and endorsing tournaments', text: 'Press releases name the association as a co-organiser of national and international tournaments, from regional events to Royal Trophy championships, and some events are described as endorsed by the association.', src: 'newswit' },
  { title: 'Working with public and private partners', text: 'Past events were held with the Ministry of Education, the Office of the Basic Education Commission (OBEC), language institutes, shopping centres and many sponsors.', src: 'newswit' },
  { title: 'A stage for every level', text: 'The standard rules define divisions from primary and secondary school to the open public, and past regional events have run several games on the same day.', src: 'rules' },
  { title: 'Connected to the world', text: 'The standard rules state that the association is a member of WESPA (World English-Language Scrabble Players Association) under the abbreviation TCA, and many rules refer to the WESPA Rules.', src: 'rules' }];
export const timeline: Milestone[] = [
  tl(0, 'Cyberdict partners with the association', 'A press release describes a partnership between Cyberdict and the association to run the Thailand Crossword Game Championship.'),
  tl(1, 'Cyberdict Crossword Game Northern Championship, 14th edition', 'Six competition categories in Chiang Mai, covering Crossword Game, A-Math, Kumkom and Sudoku.'),
  tl(2, 'Brand’s Games: International Brain Sports', 'Held with the Ministry of Education and the association, including the 31st Thailand and International Crossword Game Championship for the Royal Trophy.'),
  tl(3, 'ECC Puzzle Thailand Open (8th) and Kumkom Thailand Championship (10th)', 'ECC language institute and the association held academic brain-sport competitions, including the Kumkom Thailand Championship.'),
  tl(4, 'Brand’s Games 2018 and ECC International Youth Crossword Game (30th)', 'A brain-sports festival at CentralPlaza WestGate and an international youth competition at CentralPlaza Bangna (24–25 Nov 2018).'),
  tl(5, 'Maxploys Crossword Game Northern Championship (22nd) and Brand’s Brain International Challenge 2019', 'The northern event ran 7 categories; news reports say the 2019 Brand’s Games festival welcomed more than 5,000 visitors.'),
  tl(6, 'Jooze Crossword Game Grand Prix Thailand Championship 2023', 'A 4-leg points series across 3 games, for English word players, equation players and number-puzzle solvers.'),
  tl(7, 'To Autocar Bangkok International Crossword Game Championship 2024 and Magnolia Crossword Game Thailand Series (Central)', 'The international crossword event on 12–14 Oct 2024 and the central regional championship on 16–17 Nov 2024, described as endorsed by the association.'),
  tl(8, 'Magnolia Crossword Game 2025 · Magnolia Mathsmith National Championship 2025 · To Autocar 2025', '2025 included the central regional event (5–6 Jul, over 60,000 baht in prizes), the national Mathsmith championship (15–17 Aug, over 100,000 baht in prizes) and the international event (11–13 Oct) at Paradise Park.'),
  tl(9, 'B.Grimm Gamesmith Thailand Championship 2026', 'The major event of the year on 18–19 Jul 2026 at Paradise Park, competing for the Royal Trophy in 3 categories: Wordsmith, Mathsmith and Thaismith.')];
export const pending = ['Year of founding and history of the association', 'Vision, mission and objectives under the association’s by-laws', 'Current president and committee (news from 2017–2019 names Mr Wiroj Thavornwattanayong as president at that time)', 'Official address, telephone and e-mail', 'Statistics on members, athletes and tournaments held'];
