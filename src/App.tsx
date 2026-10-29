import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import { loaders } from './lib/prefetch';
import { LoadingState } from './components/common/States';

// Every page except Home is a separate download, fetched on first visit (or earlier, when a link is hovered).
const NewsPage = lazy(loaders.news), NewsDetailPage = lazy(loaders.newsDetail), EventsPage = lazy(loaders.events), EventDetailPage = lazy(loaders.eventDetail);
const GamesPage = lazy(loaders.games), RulesPage = lazy(loaders.rules), RankingsPage = lazy(loaders.rankings), QaPage = lazy(loaders.qa), AboutPage = lazy(loaders.about);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const RequireAdmin = lazy(() => import('./pages/admin/RequireAdmin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const NewsAdminPage = lazy(() => import('./pages/admin/NewsAdminPage'));
const EventsAdminPage = lazy(() => import('./pages/admin/EventsAdminPage'));
const AthletesAdminPage = lazy(() => import('./pages/admin/AthletesAdminPage'));
const QaAdminPage = lazy(() => import('./pages/admin/QaAdminPage'));

export default function App() {
  return (<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/news/:id" element={<NewsDetailPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/games/:slug" element={<RulesPage />} />
      <Route path="/rankings" element={<RankingsPage />} />
      <Route path="/qa" element={<QaPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route element={<Suspense fallback={<LoadingState />}><RequireAdmin /></Suspense>}><Route element={<AdminLayout />}>
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/news" element={<NewsAdminPage />} />
      <Route path="/admin/events" element={<EventsAdminPage />} />
      <Route path="/admin/rankings" element={<AthletesAdminPage />} />
      <Route path="/admin/qa" element={<QaAdminPage />} />
    </Route></Route>
  </Routes></BrowserRouter>);
}
