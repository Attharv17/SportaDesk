import { Suspense, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Star, Activity, Trophy, Users, Calendar,
  MapPin, CheckCircle, XCircle, MinusCircle, Clock
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import PageWrapper, { staggerContainer, fadeUp } from '../../components/ui/PageWrapper'
import StatsCard from '../../components/dashboard/StatsCard'
import GlassCard from '../../components/ui/GlassCard'
import ParticleField from '../../components/three/ParticleField'
import { useAuthStore } from '../../context/authContext'
import { apiGetPlayerProfile, apiGetPlayerMatches, type PlayerProfile, type PlayerMatch } from '../../services/api'
import { getSportEmoji } from '../../lib/utils'

function ResultBadge({ result }: { result: PlayerMatch['result'] }) {
  if (!result) return (
    <span className="flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
      <Clock size={10} /> Pending
    </span>
  )
  const map = {
    win:  { icon: <CheckCircle size={10} />, label: 'Win',  cls: 'text-lime-400 bg-lime-400/10' },
    loss: { icon: <XCircle size={10} />,    label: 'Loss', cls: 'text-red-400 bg-red-400/10'   },
    draw: { icon: <MinusCircle size={10} />, label: 'Draw', cls: 'text-yellow-400 bg-yellow-400/10' },
  }
  const { icon, label, cls } = map[result]
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {icon}{label}
    </span>
  )
}

function MatchCard({ match }: { match: PlayerMatch }) {
  const isUpcoming = match.status === 'scheduled' || match.status === 'upcoming'
  const isLive     = match.status === 'live'
  const date       = new Date(match.scheduledAt)

  return (
    <GlassCard className="p-4" glow={isLive ? 'lime' : 'none'} hover={false}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{getSportEmoji(match.sport)}</span>
          <span className="text-xs text-gray-400 truncate max-w-[140px]">{match.tournamentName}</span>
          {match.round && <span className="text-[10px] text-gray-500">• {match.round}</span>}
        </div>
        {isLive
          ? <span className="flex items-center gap-1 text-[10px] font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full animate-pulse">● LIVE</span>
          : <ResultBadge result={match.result} />
        }
      </div>

      <div className="flex items-center justify-between gap-2 bg-black/20 rounded-xl p-3 border border-white/5">
        <div className="flex-1 text-center">
          <p className={`font-bold text-sm truncate ${match.isHome ? 'text-cyan-neon' : 'text-white'}`}>
            {match.homeTeam.name}
          </p>
          {match.isHome && <p className="text-[10px] text-gray-500 mt-0.5">You</p>}
        </div>

        <div className="text-center shrink-0 px-2">
          {(match.score.home != null && match.score.away != null)
            ? <p className="font-mono font-bold text-white text-sm">{match.score.home} – {match.score.away}</p>
            : <p className="text-xs text-gray-500 font-bold">VS</p>
          }
          <p className="text-[10px] text-gray-600 mt-0.5">
            {isUpcoming
              ? `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : date.toLocaleDateString()}
          </p>
        </div>

        <div className="flex-1 text-center">
          <p className={`font-bold text-sm truncate ${!match.isHome ? 'text-cyan-neon' : 'text-white'}`}>
            {match.awayTeam.name}
          </p>
          {!match.isHome && <p className="text-[10px] text-gray-500 mt-0.5">You</p>}
        </div>
      </div>

      {match.venue && (
        <p className="flex items-center gap-1 text-[10px] text-gray-500 mt-2.5 px-1">
          <MapPin size={10} />{match.venue}
        </p>
      )}
    </GlassCard>
  )
}

export default function PlayerDashboard() {
  const user = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [matches, setMatches]  = useState<PlayerMatch[]>([])
  const [loading, setLoading]  = useState(true)
  const [tab, setTab]          = useState<'upcoming' | 'completed'>('upcoming')

  useEffect(() => {
    Promise.all([apiGetPlayerProfile(), apiGetPlayerMatches()])
      .then(([{ data: p }, { data: m }]) => {
        setProfile(p)
        setMatches(m || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const wins      = matches.filter(m => m.result === 'win').length
  const losses    = matches.filter(m => m.result === 'loss').length
  const draws     = matches.filter(m => m.result === 'draw').length
  const played    = wins + losses + draws
  const winRate   = played > 0 ? Math.round((wins / played) * 100) : 0
  const upcoming  = matches.filter(m => m.status === 'upcoming' || m.status === 'scheduled')
  const completed = matches.filter(m => m.status === 'completed')
  const displayMatches = tab === 'upcoming' ? upcoming : completed

  return (
    <PageWrapper className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />

      <div className="md:ml-[240px] pt-16 transition-all duration-300">
        <div className="relative min-h-screen pb-20">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <Suspense fallback={null}><ParticleField color="#a3ff00" /></Suspense>
          </div>
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate"
              className="flex items-center gap-4 mb-8">
              <motion.div variants={fadeUp} className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <Star size={40} className="text-lime-neon"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(163,255,0,0.8))' }} />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-lime-neon/20 blur-md" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Welcome, <span className="text-gradient-cyan">{user?.name?.split(' ')[0]}</span> ⚡
                  </h1>
                  <p className="text-gray-500 text-sm">Player Overview · Read-only</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard label="Matches Played" value={played}
                icon={<Activity size={18} />} trend="All time" color="cyan" delay={0.1} />
              <StatsCard label="Wins" value={wins}
                icon={<Trophy size={18} />} trend={`${winRate}% win rate`} trendUp color="lime" delay={0.2} />
              <StatsCard label="Losses" value={losses}
                icon={<XCircle size={18} />} trendUp={false} trend="Historical" color="magenta" delay={0.3} />
              <StatsCard label="Upcoming" value={upcoming.length}
                icon={<Calendar size={18} />} trend="Scheduled" trendUp color="yellow" delay={0.4} />
            </div>

            {loading ? (
              <div className="grid lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => (
                  <div key={i} className="glass rounded-2xl h-48 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">

                {/* Left: Team + Profile */}
                <div className="space-y-6">
                  {/* Personal card */}
                  <GlassCard className="p-5" glow="lime">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                      My Profile
                    </h2>
                    {profile ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-lime-neon/10 border border-lime-neon/30
                            flex items-center justify-center text-2xl font-bold text-lime-neon">
                            {profile.name.substring(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg leading-tight">{profile.name}</p>
                            <p className="text-xs text-gray-400">{profile.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Position</p>
                            <p className="text-white font-semibold text-sm mt-0.5">{profile.position || '—'}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Jersey #</p>
                            <p className="text-white font-semibold text-sm mt-0.5">
                              {profile.jerseyNumber != null ? `#${profile.jerseyNumber}` : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                              <motion.div className="h-full bg-lime-neon rounded-full"
                                initial={{ width: 0 }} animate={{ width: `${winRate}%` }}
                                transition={{ duration: 1, delay: 0.5 }} />
                            </div>
                            <span className="text-lime-neon font-bold text-sm">{winRate}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                          <span className="text-lime-400 font-medium">{wins}W</span>
                          <span className="text-yellow-400 font-medium">{draws}D</span>
                          <span className="text-red-400 font-medium">{losses}L</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No player profile found. Ask your manager to add you to a team.</p>
                    )}
                  </GlassCard>

                  {/* Team card */}
                  {profile?.team && (
                    <GlassCard className="p-5" glow="cyan">
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                        My Team
                      </h2>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                          style={{ backgroundColor: profile.team.color + '20', color: profile.team.color, border: `1px solid ${profile.team.color}` }}>
                          {profile.team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{profile.team.name}</p>
                          <p className="text-xs text-gray-400">{profile.team.teammates.length + 1} members</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Teammates</p>
                        <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                          {profile.team.teammates.length === 0
                            ? <p className="text-xs text-gray-600 italic">No other teammates yet.</p>
                            : profile.team.teammates.map(t => (
                              <div key={t.id} className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg text-sm border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-300">
                                    {t.name[0]}
                                  </div>
                                  <span className="text-gray-200">{t.name}</span>
                                </div>
                                <span className="text-[10px] text-gray-500">
                                  {t.position || ''}{t.jerseyNumber ? ` #${t.jerseyNumber}` : ''}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>

                      {profile.team.tournaments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Tournaments Joined</p>
                          {profile.team.tournaments.map(tr => (
                            <div key={tr.id} className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <span>{getSportEmoji(tr.sport)}</span>
                                <span className="text-sm text-gray-200 truncate max-w-[120px]">{tr.name}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                                tr.status === 'active' ? 'text-lime-400 bg-lime-400/10' :
                                tr.status === 'completed' ? 'text-gray-400 bg-gray-400/10' :
                                'text-cyan-400 bg-cyan-400/10'
                              }`}>{tr.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  )}
                </div>

                {/* Right: Match Schedule */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                      <Calendar className="text-cyan-neon" /> Match Schedule
                    </h2>
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                      {(['upcoming', 'completed'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                            tab === t
                              ? 'bg-cyan-neon text-bg-base'
                              : 'text-gray-400 hover:text-white'
                          }`}>
                          {t} {t === 'upcoming' ? `(${upcoming.length})` : `(${completed.length})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {displayMatches.length === 0 ? (
                    <GlassCard className="p-10 text-center" hover={false}>
                      <Users className="mx-auto text-gray-600 mb-3" size={32} />
                      <p className="text-gray-400 text-sm">No {tab} matches found.</p>
                    </GlassCard>
                  ) : (
                    <div className="space-y-3">
                      {displayMatches.map((match, i) => (
                        <motion.div key={match.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}>
                          <MatchCard match={match} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
