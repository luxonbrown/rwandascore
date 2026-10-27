import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/admin/AdminLayout'
import { useDataSync } from './hooks/useDataSync'
import Home from './pages/Home'
import Live from './pages/Live'
import Fixtures from './pages/Fixtures'
import Results from './pages/Results'
import Tables from './pages/Tables'
import Competitions from './pages/Competitions'
import CompetitionDetail from './pages/CompetitionDetail'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import News from './pages/News'
import ArticleDetail from './pages/ArticleDetail'
import MatchDetail from './pages/MatchDetail'
import Favourites from './pages/Favourites'
import Search from './pages/Search'
import NotFound from './pages/NotFound'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCompetitions from './pages/admin/AdminCompetitions'
import AdminTeams from './pages/admin/AdminTeams'
import AdminPlayers from './pages/admin/AdminPlayers'
import AdminFixtures from './pages/admin/AdminFixtures'
import AdminLive from './pages/admin/AdminLive'
import AdminNews from './pages/admin/AdminNews'
import AdminUploads from './pages/admin/AdminUploads'
import AdminActivity from './pages/admin/AdminActivity'
import AdminUsers from './pages/admin/AdminUsers'

export default function App() {
  useDataSync()

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="live" element={<Live />} />
        <Route path="fixtures" element={<Fixtures />} />
        <Route path="results" element={<Results />} />
        <Route path="tables" element={<Tables />} />
        <Route path="competitions" element={<Competitions />} />
        <Route path="competitions/:id" element={<CompetitionDetail />} />
        <Route path="teams" element={<Teams />} />
        <Route path="teams/:id" element={<TeamDetail />} />
        <Route path="players" element={<Players />} />
        <Route path="players/:id" element={<PlayerDetail />} />
        <Route path="news" element={<News />} />
        <Route path="news/:slug" element={<ArticleDetail />} />
        <Route path="matches/:id" element={<MatchDetail />} />
        <Route path="favourites" element={<Favourites />} />
        <Route path="search" element={<Search />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="competitions" element={<AdminCompetitions />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="fixtures" element={<AdminFixtures />} />
        <Route path="live" element={<AdminLive />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="uploads" element={<AdminUploads />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
