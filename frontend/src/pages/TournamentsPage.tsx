import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import PageWrapper, { staggerContainer, fadeUp } from '../components/ui/PageWrapper'
import TournamentCard from '../components/tournaments/TournamentCard'
import NeonButton from '../components/ui/NeonButton'
import { apiGetTournaments } from '../lib/api'
import type { Tournament, Sport, TournamentStatus } from '../types'

const sportOptions: { label: string; value: Sport | 'all' }[] = [
  { label: 'All Sports', value: 'all' },
  { label: '🏏 Cricket', value: 'cricket' },
  { label: '🤼 Kabaddi', value: 'kabaddi' },
  { label: '⚽ Football', value: 'football' },
  { label: '🏀 Basketball', value: 'basketball' },
]

const statusOptions: { label: string; value: TournamentStatus | 'all' }[] = [
  { label: 'All Status', value: 'all' },
  { label: '🔴 Live', value: 'live' },
  { label: '📅 Upcoming', value: 'upcoming' },
  { label: '✅ Completed', value: 'completed' },
]

export default function TournamentsPage() {
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState<Sport | 'all'>('all')
  const [status, setStatus] = useState<TournamentStatus | 'all'>('all')
  const [filtered, setFiltered] = useState<Tournament[]>([])

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      apiGetTournaments({ search: query, sport, status, limit: 50 })
        .then((result) => { if (!cancelled) setFiltered(result.data) })
        .catch(console.error)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, sport, status])

  return (
    <PageWrapper className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />

      <div className="md:ml-[240px] pt-16">
        <div className="relative min-h-screen">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mb-8">
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display font-bold text-3xl text-white mb-1">Tournaments</h1>
                  <p className="text-gray-500 text-sm">{filtered.length} tournament{filtered.length !== 1 ? 's' : ''} found</p>
                </div>
                <Link to="/tournaments/create">
                  <NeonButton variant="cyan" size="md">+ Create New</NeonButton>
                </Link>
              </motion.div>

              {/* Filters */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Search tournaments, venues…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-neon/40 transition-all"
                  />
                </div>

                {/* Sport Filter */}
                <div className="relative">
                  <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as Sport | 'all')}
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-neon/40 appearance-none cursor-pointer transition-all"
                  >
                    {sportOptions.map((o) => <option key={o.value} value={o.value} className="bg-navy-dark">{o.label}</option>)}
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TournamentStatus | 'all')}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-neon/40 appearance-none cursor-pointer transition-all"
                >
                  {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-navy-dark">{o.label}</option>)}
                </select>
              </motion.div>
            </motion.div>

            {/* Grid */}
            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <TournamentCard tournament={t} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-display font-semibold text-white text-xl mb-2">No tournaments found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filters</p>
                <NeonButton variant="ghost" onClick={() => { setQuery(''); setSport('all'); setStatus('all') }}>
                  Clear Filters
                </NeonButton>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
