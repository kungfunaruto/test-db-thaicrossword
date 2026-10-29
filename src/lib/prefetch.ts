// Loads a page's code and first data while the pointer is over a link, so the page opens instantly on click.
import { prefetch } from './query';
import {
  eventDetailKey, eventsKey, FAQ_KEY, fetchEventDetail, fetchEvents, fetchFaqs, fetchNews, fetchNewsDetail, fetchRankings, newsDetailKey, newsKey, rankingsKey,
  type EventsQuery, type NewsQuery, type RankQuery,
} from '../services/publicService';

export const DEFAULT_NEWS: NewsQuery = { q: '', category: '', range: null, page: 1 };
export const DEFAULT_EVENTS: EventsQuery = { q: '', status: '', range: null, page: 1 };
export const defaultRank = (game: string): RankQuery => ({ game, q: '', page: 1 });

export const loaders = {
  news: () => import('../pages/NewsPage'), newsDetail: () => import('../pages/NewsDetailPage'),
  events: () => import('../pages/EventsPage'), eventDetail: () => import('../pages/EventDetailPage'),
  games: () => import('../pages/GamesPage'), rules: () => import('../pages/RulesPage'), rankings: () => import('../pages/RankingsPage'),
  qa: () => import('../pages/QaPage'), about: () => import('../pages/AboutPage'),
};
const quiet = (p: Promise<unknown>) => { p.catch(() => {}); };

export function prefetchRoute(path: string) {
  if (path === '/news') { quiet(loaders.news()); prefetch(newsKey(DEFAULT_NEWS), () => fetchNews(DEFAULT_NEWS)); }
  else if (path === '/events') { quiet(loaders.events()); prefetch(eventsKey(DEFAULT_EVENTS), () => fetchEvents(DEFAULT_EVENTS)); }
  else if (path.startsWith('/rankings')) { quiet(loaders.rankings()); const g = new URLSearchParams(path.split('?')[1] ?? '').get('game') ?? 'crossword'; prefetch(rankingsKey(defaultRank(g)), () => fetchRankings(defaultRank(g))); }
  else if (path === '/qa') { quiet(loaders.qa()); prefetch(FAQ_KEY, fetchFaqs); }
  else if (path === '/games') quiet(loaders.games());
  else if (path.startsWith('/games/')) quiet(loaders.rules());
  else if (path === '/about') quiet(loaders.about());
}
export const prefetchNews = (id: string) => { quiet(loaders.newsDetail()); prefetch(newsDetailKey(id), () => fetchNewsDetail(id)); };
export const prefetchEvent = (id: string) => { quiet(loaders.eventDetail()); prefetch(eventDetailKey(id), () => fetchEventDetail(id)); };
