import { Suspense, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Sword, Activity, Users, PlusCircle, Trash2, Edit } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import PageWrapper, { staggerContainer, fadeUp } from '../../components/ui/PageWrapper'
import StatsCard from '../../components/dashboard/StatsCard'
import MatchTicker from '../../components/dashboard/MatchTicker'
import TournamentCard from '../../components/tournaments/TournamentCard'
import ParticleField from '../../components/three/ParticleField'
import { useAuthStore } from '../../context/authContext'
import { apiGetStats, apiGetOrganizerTournaments, apiDeleteTournament } from '../../services/api'
import type { Tournament } from '../../types'
import NeonButton from '../../components/ui/NeonButton'

export default function OrganizerDashboard() {
  const user = useAuthStore((s) => s.user)
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([])

  const [stats, setStats] = useState({
    activeTournaments: 0,
    totalMatches: 0,
    totalTeams: 0,
    revenueEstimate: '—',
  })

  const loadData = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        apiGetOrganizerTournaments(),
        apiGetStats(),
      ])
      setMyTournaments(tRes.data)
      setStats(sRes)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this tournament?')) return
    try {
      await apiDeleteTournament(id)
      loadData()
    } catch (err) {
      alert('Failed to delete tournament')
    }
  }

  return (
    <PageWrapper className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />

      {/* Main Content */}
      <div className="md:ml-[240px] pt-16 transition-all duration-300">
        <div className="relative min-h-screen">
          {/* 3D Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <Suspense fallback={null}>
              <ParticleField color="#00f5ff" />
            </Suspense>
          </div>
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Header */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                <div className="relative">
                  <Trophy size={40} className="text-cyan-neon"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(0,245,255,0.8))' }} />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-cyan-neon/20 blur-md"
                  />
                </div>
                <div>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Welcome Organizer, <span className="text-gradient-cyan">{user?.name?.split(' ')[0]}</span> 👋
                  </h1>
                  <p className="text-gray-500 text-sm capitalize">Organizer Control Panel</p>
                </div>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Link to="/tournaments/create">
                  <NeonButton variant="cyan" size="md">
                    <PlusCircle size={16} /> New Tournament
                  </NeonButton>
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard label="Active Tournaments" value={stats.activeTournaments}
                icon={<Trophy size={18} />} trend="+2 this month" trendUp color="cyan" delay={0.1} />
              <StatsCard label="Total Matches" value={stats.totalMatches}
                icon={<Activity size={18} />} trend="+5 this week" trendUp color="lime" delay={0.2} />
              <StatsCard label="Total Teams" value={stats.totalTeams}
                icon={<Users size={18} />} trend="+3 new" trendUp color="magenta" delay={0.3} />
              <StatsCard label="Prize Pool" value={stats.revenueEstimate}
                icon={<Sword size={18} />} trend="All seasons" color="yellow" delay={0.4} />
            </div>

            {/* Live Ticker */}
            <div className="mb-8">
              <MatchTicker />
            </div>

            {/* My Tournaments */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-white">Manage Tournaments</h2>
              <Link to="/tournaments" className="text-sm text-cyan-neon hover:underline flex items-center gap-1">
                View all
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myTournaments.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="relative group"
                >
                  <TournamentCard tournament={t} />
                  {/* Organizer Quick Actions */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/tournaments/${t.id}/edit`} onClick={(e) => e.stopPropagation()} className="p-2 bg-black/60 rounded border border-white/10 hover:border-cyan-neon text-white/70 hover:text-cyan-neon transition-colors z-20">
                      <Edit size={14} />
                    </Link>
                    <button onClick={(e) => handleDelete(t.id, e)} className="p-2 bg-black/60 rounded border border-white/10 hover:border-red-500 text-white/70 hover:text-red-500 transition-colors z-20">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {/* Create New Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Link to="/tournaments/create">
                  <div className="glass rounded-2xl p-5 border-2 border-dashed border-white/10 hover:border-cyan-neon/30 transition-all duration-300 h-full min-h-[180px] flex flex-col items-center justify-center gap-3 group cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-neon/10 border border-cyan-neon/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlusCircle size={22} className="text-cyan-neon" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400 group-hover:text-cyan-neon transition-colors">
                      Create New Tournament
                    </p>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
