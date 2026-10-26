export type Block =
  | { t: 'p'; text: string } | { t: 'h'; text: string }
  | { t: 'ul'; items: string[] } | { t: 'ol'; items: string[] }
  | { t: 'cards'; items: { title: string; text: string; color?: string }[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'note'; tone: 'info' | 'warn'; text: string };
export interface RuleSection { id: string; title: string; blocks: Block[] }
export interface Fact { icon: 'users' | 'grid' | 'tiles' | 'clock' | 'hand' | 'star'; label: string; value: string; sub?: string }
export interface RuleGame {
  slug: 'crossword' | 'a-math' | 'kumkom'; gameType: 'crossword' | 'a_math' | 'kumkom';
  title: string; name: string; brand: string; tagline: string; version: string; accent: string;
  facts: Fact[]; sections: RuleSection[]; pdf: { url: string; label: string };
}
