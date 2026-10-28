import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import RankingsPage from './pages/RankingsPage';
import GamesPage from './pages/GamesPage';
import QaPage from './pages/QaPage';
import RulesView from './components/rules/RulesView';
import { aMath, crossword, kumkom } from './content/rules';
import AboutPage from './pages/AboutPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import RequireAdmin from './pages/admin/RequireAdmin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ResourceManager from './pages/admin/ResourceManager';
import RankingsAdminPage from './pages/admin/RankingsAdminPage';
import { eventsResource, faqsResource, newsResource } from './config/adminResources';

const P = (title: string) => <PlaceholderPage title={title} />;
export default function App() {
  return (<BrowserRouter><Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/news/:id" element={<NewsDetailPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/games/crossword" element={<RulesView game={crossword} />} />
      <Route path="/games/a-math" element={<RulesView game={aMath} />} />
      <Route path="/games/kumkom" element={<RulesView game={kumkom} />} />
      <Route path="/rankings" element={<RankingsPage />} />
      <Route path="/qa" element={<QaPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="*" element={P('ไม่พบหน้าที่ต้องการ')} />
    </Route>
    <Route element={<RequireAdmin />}><Route element={<AdminLayout />}>
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/news" element={<ResourceManager key="news" resource={newsResource} />} />
      <Route path="/admin/events" element={<ResourceManager key="events" resource={eventsResource} />} />
      <Route path="/admin/rankings" element={<RankingsAdminPage />} />
      <Route path="/admin/qa" element={<ResourceManager key="qa" resource={faqsResource} />} />
    </Route></Route>
  </Routes></BrowserRouter>);
}
