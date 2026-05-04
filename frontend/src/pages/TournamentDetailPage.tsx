import { useState, useEffect, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Calendar, Trophy, Activity, BarChart2, Zap } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import PageWrapper from '../components/ui/PageWrapper'
import NeonButton from '../components/ui/NeonButton'
import MatchCard from '../components/tournaments/MatchCard'
import StandingsTable from '../components/tournaments/StandingsTable'
import TournamentBracket from '../components/tournaments/TournamentBracket'
import ParticleField from '../components/three/ParticleField'
import { sportConfig } from '../lib/mockData'
import { formatDate } from '../lib/utils'
import { apiGetTournament } from '../lib/api'
import type { Tournament } from '../types'

const TABS = [
  { id: 'overview',  label: 'Overview',   icon: <Trophy size={14} /> },
  { id: 'teams',     label: 'Teams',      icon: <Users size={14} /> },
  { id: 'fixtures',  label: 'Fixtures',   icon: <Calendar size={14} /> },
  { id: 'bracket',   label: 'Bracket',    icon: <Activity size={14} /> },
  { id: 'standings', label: 'Standings',  icon: <BarChart2 size={14} /> },
  { id: 'live',      label: 'Live Score', icon: <Zap size={14} /> },
]

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!id) return
    apiGetTournament(id)
      .then(setTournament)
      .catch(() => setLoadError(true))
  }, [id])

  if (loadError || (!tournament && loadError)) {
    return (
      <PageWrapper className="min-h-screen bg-bg-base flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">Tournament not found</h2>
          <NeonButton variant="ghost" onClick={() => navigate('/tournaments')}>
            <ArrowLeft size={16} /> Back
          </NeonButton>
        </div>
      </PageWrapper>
    )
  }

  if (!tournament) {
    return (
      <PageWrapper className="min-h-screen bg-bg-base flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-neon/30 border-t-cyan-neon rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading tournament…</p>
        </div>
      </PageWrapper>
    )
  }

  const sport = sportConfig[tournament.sport] ?? { color: '#00f5ff', icon: '🏆', glowColor: 'rgba(0,245,255,0.2)' }
  const liveMatches = tournament.matches.filter((m) => m.status === 'live')
  const upcomingMatches = tournament.matches.filter((m) => m.status === 'upcoming')
  const completedMatches = tournament.matches.filter((m) => m.status === 'completed')

  return (
    <PageWrapper className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />

      <div className="md:ml-[240px] pt-16">
        <div className="relative min-h-screen">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <Suspense fallback={null}><ParticleField color={sport.color} /></Suspense>
          </div>
          <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

          <div className="relative z-10">
            {/* Hero Banner */}
            <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, #080810 0%, ${sport.color}12 100%)` }}>
              <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 80% at 80% 50%, ${sport.glowColor} 0%, transparent 70%)` }} />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
                <button
                  onClick={() => navigate('/tournaments')}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors"
                >
                  <ArrowLeft size={15} /> Back to Tournaments
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `radial-gradient(circle, ${sport.glowColor} 0%, rgba(0,0,0,0.4) 100%)`, border: `1px solid ${sport.color}30` }}
                  >
                    {sport.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
                        ${tournament.status === 'live' ? 'text-lime-neon border-lime-neon/40 bg-lime-neon/10' :
                          tournament.status === 'upcoming' ? 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10' :
                          'text-gray-400 border-gray-600/40 bg-gray-600/10'}`}>
                        {tournament.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime-neon mr-1.5 animate-pulse" />}
                        {tournament.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{tournament.format.replace('+', ' + ')}</span>
                    </div>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-white mb-2">{tournament.name}</h1>
                    <p className="text-gray-400 text-sm max-w-xl">{tournament.description}</p>
                    <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                      <span>📅 {formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}</span>
                      <span>📍 {tournament.venue}</span>
                      <span>👥 {tournament.registeredTeams.length}/{tournament.maxTeams} Teams</span>
                      {tournament.prizePool && <span className="text-yellow-400">🏆 {tournament.prizePool}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="glass border-b border-white/5 sticky top-16 z-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all duration-200 border-b-2
                        ${activeTab === tab.id
                          ? 'text-cyan-neon border-cyan-neon'
                          : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                      style={activeTab === tab.id ? { textShadow: '0 0 10px rgba(0,245,255,0.6)' } : {}}
                    >
                      {tab.icon} {tab.label}
                      {tab.id === 'live' && liveMatches.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-neon animate-pulse ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-5">
                        <h2 className="font-display font-bold text-lg text-white">Recent Matches</h2>
                        {[...liveMatches, ...completedMatches.slice(0, 2)].map((m) => (
                          <MatchCard key={m.id} match={m} />
                        ))}
                        {liveMatches.length === 0 && completedMatches.length === 0 && (
                          <p className="text-gray-600 text-sm">No matches played yet.</p>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="glass rounded-2xl p-5 border border-white/5">
                          <h3 className="font-semibold text-white text-sm mb-4">Quick Stats</h3>
                          {[
                            ['Total Matches', tournament.matches.length],
                            ['Completed', completedMatches.length],
                            ['Upcoming', upcomingMatches.length],
                            ['Live', liveMatches.length],
                            ['Teams', tournament.registeredTeams.length],
                          ].map(([l, v]) => (
                            <div key={l as string} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                              <span className="text-xs text-gray-500">{l}</span>
                              <span className="text-sm font-bold text-white">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="glass rounded-2xl p-5 border border-white/5">
                          <h3 className="font-semibold text-white text-sm mb-3">Upcoming</h3>
                          {upcomingMatches.slice(0, 2).map((m) => (
                            <MatchCard key={m.id} match={m} compact />
                          ))}
                          {upcomingMatches.length === 0 && <p className="text-xs text-gray-600">No upcoming matches.</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TEAMS */}
                  {activeTab === 'teams' && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tournament.registeredTeams.map((team, i) => (
                        <motion.div
                          key={team.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                              style={{ backgroundColor: `${team.color}25`, color: team.color, border: `1px solid ${team.color}40`, boxShadow: `0 0 10px ${team.color}30` }}>
                              {team.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{team.name}</p>
                              <p className="text-xs text-gray-500">{team.players.length} players</p>
                            </div>
                            <div className="ml-auto text-right">
                              <p className="font-bold text-sm" style={{ color: team.color }}>{team.points} pts</p>
                              <p className="text-xs text-gray-600">{team.wins}W {team.losses}L {team.draws}D</p>
                            </div>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, team.wins * 20)}%`, backgroundColor: team.color }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* FIXTURES */}
                  {activeTab === 'fixtures' && (
                    <div className="space-y-4">
                      {liveMatches.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-lime-neon tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-neon animate-pulse" /> LIVE NOW
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {liveMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                          </div>
                        </div>
                      )}
                      {upcomingMatches.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-xs font-bold text-cyan-400 tracking-widest mb-3">UPCOMING</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                          </div>
                        </div>
                      )}
                      {completedMatches.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-3">COMPLETED</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {completedMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BRACKET */}
                  {activeTab === 'bracket' && (
                    <div>
                      <h2 className="font-display font-bold text-lg text-white mb-6">Knockout Bracket</h2>
                      <TournamentBracket teams={tournament.registeredTeams} />
                    </div>
                  )}

                  {/* STANDINGS */}
                  {activeTab === 'standings' && (
                    <StandingsTable teams={tournament.registeredTeams} sport={tournament.sport} />
                  )}

                  {/* LIVE SCORE */}
                  {activeTab === 'live' && (
                    <div className="space-y-4">
                      {liveMatches.length > 0 ? (
                        liveMatches.map((m) => (
                          <div key={m.id} className="glass rounded-2xl border border-lime-neon/20 p-6"
                            style={{ boxShadow: '0 0 30px rgba(163,255,0,0.06)' }}>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="w-2 h-2 rounded-full bg-lime-neon animate-pulse" />
                              <span className="text-xs font-bold text-lime-neon tracking-widest">LIVE · {m.round}</span>
                            </div>
                            <MatchCard match={m} />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="text-4xl mb-4">📡</div>
                          <p className="text-gray-500 text-sm">No live matches right now</p>
                          <p className="text-gray-600 text-xs mt-1">Check the Fixtures tab for upcoming matches</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
