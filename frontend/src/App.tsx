import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import OrganizerDashboard from './pages/OrganizerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import PlayerDashboard from './pages/PlayerDashboard'
import TournamentsPage from './pages/TournamentsPage'
import CreateTournamentPage from './pages/CreateTournamentPage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import ProtectedRoute from './routes/ProtectedRoute'
import OrganizerRoute from './routes/OrganizerRoute'
import ManagerRoute from './routes/ManagerRoute'
import PlayerRoute from './routes/PlayerRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Main Dashboard Redirect */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Role-Specific Dashboards */}
          <Route path="/organizer/dashboard" element={<OrganizerRoute><OrganizerDashboard /></OrganizerRoute>} />
          <Route path="/manager/dashboard" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
          <Route path="/player/dashboard" element={<PlayerRoute><PlayerDashboard /></PlayerRoute>} />

          <Route path="/tournaments" element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
          <Route path="/tournaments/create" element={<OrganizerRoute><CreateTournamentPage /></OrganizerRoute>} />
          <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetailPage /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
