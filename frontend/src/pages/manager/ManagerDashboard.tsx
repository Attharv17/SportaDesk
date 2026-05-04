import { Suspense, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Activity, Users, PlusCircle, Shield, X, Trash2, UserPlus, Calendar } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import PageWrapper, { staggerContainer, fadeUp } from '../../components/ui/PageWrapper'
import StatsCard from '../../components/dashboard/StatsCard'
import GlassCard from '../../components/ui/GlassCard'
import NeonButton from '../../components/ui/NeonButton'
import ParticleField from '../../components/three/ParticleField'
import { useAuthStore } from '../../context/authContext'
import {
  apiGetManagerTeams,
  apiGetManagerMatches,
  apiCreateManagerTeam,
  apiDeleteManagerTeam,
  apiAddManagerPlayer,
  apiRemoveManagerPlayer,
  type Team,
  type Match
} from '../../services/api'

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user)

  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  
  const [isCreateTeam, setIsCreateTeam] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: '', color: '#00ffff' })

  const [isAddPlayer, setIsAddPlayer] = useState<string | null>(null)
  const [playerForm, setPlayerForm] = useState({ name: '', position: '', jerseyNumber: '' })

  const loadData = async () => {
    try {
      const [{ data: tData }, { data: mData }] = await Promise.all([
        apiGetManagerTeams(),
        apiGetManagerMatches()
      ])
      setTeams(tData || [])
      setMatches(mData || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiCreateManagerTeam(teamForm.name, teamForm.color)
      setIsCreateTeam(false)
      setTeamForm({ name: '', color: '#00ffff' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Delete this team?')) return
    try {
      await apiDeleteManagerTeam(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddPlayer) return
    try {
      await apiAddManagerPlayer(isAddPlayer, {
        name: playerForm.name,
        position: playerForm.position,
        jerseyNumber: playerForm.jerseyNumber ? parseInt(playerForm.jerseyNumber) : undefined
      })
      setIsAddPlayer(null)
      setPlayerForm({ name: '', position: '', jerseyNumber: '' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRemovePlayer = async (teamId: string, playerId: string) => {
    if (!confirm('Remove player?')) return
    try {
      await apiRemoveManagerPlayer(teamId, playerId)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'upcoming')
  const completedMatches = matches.filter(m => m.status === 'completed')

  return (
    <PageWrapper className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />

      <div className="md:ml-[240px] pt-16 transition-all duration-300">
        <div className="relative min-h-screen pb-20">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <Suspense fallback={null}>
              <ParticleField color="#ff00ff" />
            </Suspense>
          </div>
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                <div className="relative">
                  <Users size={40} className="text-magenta-neon"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(255,0,255,0.8))' }} />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-magenta-neon/20 blur-md"
                  />
                </div>
                <div>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Welcome Manager, <span className="text-gradient-cyan">{user?.name?.split(' ')[0]}</span> 👋
                  </h1>
                  <p className="text-gray-500 text-sm capitalize">Team Management Panel</p>
                </div>
              </motion.div>

              <motion.div variants={fadeUp}>
                <NeonButton variant="magenta" size="md" onClick={() => setIsCreateTeam(true)}>
                  <PlusCircle size={16} /> Create Team
                </NeonButton>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatsCard label="My Teams" value={teams.length}
                icon={<Shield size={18} />} trend="Active" color="magenta" delay={0.1} />
              <StatsCard label="Matches Played" value={completedMatches.length}
                icon={<Trophy size={18} />} trend="Historical" color="cyan" delay={0.2} />
              <StatsCard label="Upcoming Matches" value={upcomingMatches.length}
                icon={<Calendar size={18} />} trend="Scheduled" trendUp color="lime" delay={0.3} />
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Teams Section */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <Shield className="text-cyan-neon" /> My Teams
                </h2>
                
                {teams.length === 0 ? (
                  <GlassCard className="p-8 text-center text-gray-400">
                    <p>No teams created yet.</p>
                  </GlassCard>
                ) : (
                  teams.map(team => (
                    <GlassCard key={team.id} className="p-6" glow="cyan">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl" 
                               style={{ backgroundColor: team.color + '20', color: team.color, border: `1px solid ${team.color}` }}>
                            {team.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-white">{team.name}</h3>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <span>{team.players?.length || 0} Players</span>
                              <span>•</span>
                              <span>{team.tournaments?.length || 0} Tournaments</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => setIsAddPlayer(team.id)} className="flex-1 sm:flex-none p-2 text-cyan-neon bg-cyan-neon/10 hover:bg-cyan-neon/20 rounded-lg transition-colors flex items-center justify-center" title="Add Player">
                            <UserPlus size={18} />
                          </button>
                          <button onClick={() => handleDeleteTeam(team.id)} className="flex-1 sm:flex-none p-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center" title="Delete Team">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Players */}
                        <div className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Users size={14} className="text-cyan-neon"/> Roster
                          </h4>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {(!team.players || team.players.length === 0) ? (
                              <p className="text-xs text-gray-500 italic">No players added.</p>
                            ) : (
                              team.players.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg text-sm border border-white/5 hover:border-white/10 transition-colors">
                                  <div className="flex flex-col">
                                    <span className="text-white font-medium">{p.name}</span>
                                    <span className="text-xs text-gray-400">
                                      {p.position || 'N/A'} {p.jerseyNumber ? ` • #${p.jerseyNumber}` : ''}
                                    </span>
                                  </div>
                                  <button onClick={() => handleRemovePlayer(team.id, p.id)} className="text-red-400/70 hover:text-red-400 p-1 hover:bg-red-400/10 rounded">
                                    <X size={14} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Tournaments Joined */}
                        <div className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Trophy size={14} className="text-magenta-neon"/> Tournaments Joined
                          </h4>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {(!team.tournaments || team.tournaments.length === 0) ? (
                              <p className="text-xs text-gray-500 italic">Not joined any tournament.</p>
                            ) : (
                              team.tournaments.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg text-sm border border-white/5">
                                  <span className="text-white font-medium truncate max-w-[150px]" title={t.name}>{t.name}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold \${
                                    t.status === 'active' ? 'bg-lime-500/20 text-lime-400' :
                                    t.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                                    'bg-cyan-500/20 text-cyan-400'
                                  }`}>
                                    {t.status}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>

              {/* Sidebar Section */}
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <Activity className="text-lime-neon" /> Matches & Live
                </h2>
                
                <div className="space-y-4">
                  {upcomingMatches.length === 0 ? (
                    <GlassCard className="p-6 text-center text-gray-400">
                      <p className="text-sm">No upcoming matches.</p>
                    </GlassCard>
                  ) : (
                    upcomingMatches.map(match => (
                      <GlassCard key={match.id} className="p-4" glow="lime">
                        <div className="text-xs text-lime-neon mb-2 flex items-center justify-between">
                          <span>{match.tournamentName || 'Tournament'}</span>
                          <span>{new Date(match.startTime || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                          <span className="font-semibold text-white truncate max-w-[80px]" title={match.homeTeam?.name}>
                            {match.homeTeam?.name || 'TBD'}
                          </span>
                          <span className="text-gray-500 text-xs px-2 font-bold bg-white/5 py-1 rounded">VS</span>
                          <span className="font-semibold text-white truncate max-w-[80px] text-right" title={match.awayTeam?.name}>
                            {match.awayTeam?.name || 'TBD'}
                          </span>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {isCreateTeam && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a2e] border border-magenta-neon/30 p-6 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(255,0,255,0.15)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="text-magenta-neon"/> Create New Team
                </h3>
                <button onClick={() => setIsCreateTeam(false)} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateTeam} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Team Name</label>
                  <input required autoFocus type="text" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-magenta-neon focus:ring-1 focus:ring-magenta-neon outline-none transition-all placeholder:text-gray-600"
                    placeholder="E.g. Tigers FC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Team Color</label>
                  <div className="flex gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <input type="color" value={teamForm.color} onChange={e => setTeamForm({ ...teamForm, color: e.target.value })}
                        className="absolute -inset-2 w-16 h-16 cursor-pointer" />
                    </div>
                    <input type="text" value={teamForm.color} onChange={e => setTeamForm({ ...teamForm, color: e.target.value })}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-magenta-neon focus:ring-1 focus:ring-magenta-neon outline-none uppercase font-mono" />
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  <NeonButton variant="ghost" fullWidth onClick={() => setIsCreateTeam(false)}>Cancel</NeonButton>
                  <NeonButton type="submit" variant="magenta" fullWidth>Create Team</NeonButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Player Modal */}
      <AnimatePresence>
        {isAddPlayer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a2e] border border-cyan-neon/30 p-6 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,245,255,0.15)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="text-cyan-neon"/> Add Player
                </h3>
                <button onClick={() => setIsAddPlayer(null)} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddPlayer} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Player Name</label>
                  <input required autoFocus type="text" value={playerForm.name} onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon outline-none transition-all placeholder:text-gray-600"
                    placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Position</label>
                    <input type="text" value={playerForm.position} onChange={e => setPlayerForm({ ...playerForm, position: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon outline-none transition-all placeholder:text-gray-600"
                      placeholder="Forward" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Jersey #</label>
                    <input type="number" value={playerForm.jerseyNumber} onChange={e => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon outline-none transition-all placeholder:text-gray-600"
                      placeholder="10" />
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  <NeonButton variant="ghost" fullWidth onClick={() => setIsAddPlayer(null)}>Cancel</NeonButton>
                  <NeonButton type="submit" variant="cyan" fullWidth>Add Player</NeonButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageWrapper>
  )
}
