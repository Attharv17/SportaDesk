import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Trophy } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import PageWrapper from '../components/ui/PageWrapper'
import NeonButton from '../components/ui/NeonButton'
import { useTournamentStore } from '../store/tournamentStore'
import type { CreateTournamentForm, Sport, TournamentFormat } from '../types'

const STEPS = ['Basic Info', 'Format', 'Teams', 'Schedule', 'Review']

const SPORTS: { value: Sport; label: string; icon: string }[] = [
  { value: 'cricket', label: 'Cricket', icon: '🏏' },
  { value: 'kabaddi', label: 'Kabaddi', icon: '🤼' },
  { value: 'football', label: 'Football', icon: '⚽' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'badminton', label: 'Badminton', icon: '🏸' },
]

const FORMATS: { value: TournamentFormat; label: string; desc: string }[] = [
  { value: 'league', label: 'League', desc: 'Everyone plays everyone.' },
  { value: 'knockout', label: 'Knockout', desc: 'Single elimination.' },
  { value: 'group+knockout', label: 'Group + Knockout', desc: 'Groups then knockout.' },
  { value: 'round-robin', label: 'Round Robin', desc: 'Full round robin with playoffs.' },
]

const EMPTY: CreateTournamentForm = {
  name: '', sport: '', description: '', format: '',
  maxTeams: 8, startDate: '', endDate: '', venue: '',
  prizePool: '', entryFee: '', teamNames: Array(32).fill(''),
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600
        focus:outline-none focus:border-cyan-neon/50 focus:ring-1 focus:ring-cyan-neon/20 transition-all" />
  )
}

export default function CreateTournamentPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CreateTournamentForm>(EMPTY)
  const [creating, setCreating] = useState(false)
  const { createTournament } = useTournamentStore()
  const navigate = useNavigate()

  const set = (k: keyof CreateTournamentForm, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const canNext = () => {
    if (step === 0) return form.name.trim() !== '' && form.sport !== ''
    if (step === 1) return form.format !== ''
    if (step === 3) return form.startDate !== '' && form.endDate !== ''
    return true
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const t = await createTournament(form)
      navigate(`/tournaments/${t.id}`)
    } catch (err) {
      console.error('Failed to create tournament:', err)
      setCreating(false)
    }
  }

  const updateTeam = (i: number, val: string) => {
    const updated = [...form.teamNames]; updated[i] = val; set('teamNames', updated)
  }

  return (
    <PageWrapper className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />
      <div className="md:ml-[240px] pt-16">
        <div className="relative min-h-screen">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <Trophy size={24} className="text-cyan-neon" style={{ filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.7))' }} />
                <h1 className="font-display font-bold text-2xl text-white">Create Tournament</h1>
              </div>
              <p className="text-gray-500 text-sm">Set up your perfect tournament in 5 steps</p>
            </motion.div>

            {/* Stepper */}
            <div className="flex items-center gap-0 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                      ${i < step ? 'bg-cyan-neon border-cyan-neon text-bg-base' :
                        i === step ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10' :
                        'border-white/15 text-gray-600'}`}>
                      {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block transition-colors
                      ${i === step ? 'text-cyan-neon' : i < step ? 'text-gray-400' : 'text-gray-600'}`}>
                      {s}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 mb-4 sm:mb-5 transition-all duration-500
                      ${i < step ? 'bg-cyan-neon/50' : 'bg-white/8'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-6 sm:p-8 border border-white/8 mb-6">
              <h2 className="font-display font-bold text-xl text-white mb-6">Step {step + 1}: {STEPS[step]}</h2>

              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                >
                  {/* STEP 1 */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <InputField label="Tournament Name *">
                        <TextInput value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Neon Cricket Premier League 2026" />
                      </InputField>
                      <InputField label="Description">
                        <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                          placeholder="What's this tournament about?" rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-neon/50 transition-all resize-none" />
                      </InputField>
                      <InputField label="Sport *">
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {SPORTS.map((s) => (
                            <button key={s.value} type="button" onClick={() => set('sport', s.value)}
                              className={`p-3 rounded-xl border text-center transition-all duration-200
                                ${form.sport === s.value ? 'border-cyan-neon/60 bg-cyan-neon/10 text-cyan-neon scale-105' : 'border-white/8 bg-white/3 text-gray-400 hover:border-white/20'}`}>
                              <div className="text-2xl mb-1">{s.icon}</div>
                              <div className="text-xs font-medium">{s.label}</div>
                            </button>
                          ))}
                        </div>
                      </InputField>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <InputField label="Venue">
                          <TextInput value={form.venue} onChange={(v) => set('venue', v)} placeholder="Stadium / Ground name" />
                        </InputField>
                        <InputField label="Prize Pool">
                          <TextInput value={form.prizePool} onChange={(v) => set('prizePool', v)} placeholder="e.g. ₹50,000" />
                        </InputField>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <InputField label="Tournament Format *">
                        <div className="grid sm:grid-cols-2 gap-3">
                          {FORMATS.map((f) => (
                            <button key={f.value} type="button" onClick={() => set('format', f.value)}
                              className={`p-4 rounded-xl border text-left transition-all duration-200
                                ${form.format === f.value ? 'border-cyan-neon/60 bg-cyan-neon/10' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                              <div className={`font-semibold text-sm mb-1 ${form.format === f.value ? 'text-cyan-neon' : 'text-white'}`}>{f.label}</div>
                              <div className="text-xs text-gray-500">{f.desc}</div>
                            </button>
                          ))}
                        </div>
                      </InputField>
                      <InputField label="Number of Teams">
                        <div className="flex gap-2 flex-wrap">
                          {[4, 8, 12, 16, 32].map((n) => (
                            <button key={n} type="button" onClick={() => set('maxTeams', n)}
                              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                                ${form.maxTeams === n ? 'border-lime-neon/60 bg-lime-neon/10 text-lime-neon' : 'border-white/10 text-gray-400 hover:border-white/25'}`}>
                              {n} Teams
                            </button>
                          ))}
                        </div>
                      </InputField>
                      <InputField label="Entry Fee per Team">
                        <TextInput value={form.entryFee} onChange={(v) => set('entryFee', v)} placeholder="e.g. ₹5,000 (leave blank if free)" />
                      </InputField>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400">Enter team names — slots can be filled later.</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {Array.from({ length: form.maxTeams }).map((_, i) => (
                          <div key={i} className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-mono w-5 text-center">{i + 1}</span>
                            <input type="text" value={form.teamNames[i] ?? ''} onChange={(e) => updateTeam(i, e.target.value)}
                              placeholder={`Team ${i + 1}`}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-neon/50 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 4 */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <InputField label="Start Date *">
                          <TextInput type="date" value={form.startDate} onChange={(v) => set('startDate', v)} />
                        </InputField>
                        <InputField label="End Date *">
                          <TextInput type="date" value={form.endDate} onChange={(v) => set('endDate', v)} />
                        </InputField>
                      </div>
                      <div className="glass rounded-xl p-4 border border-cyan-neon/10">
                        <p className="text-sm font-semibold text-white mb-1">📅 Auto-scheduling</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Based on <span className="text-cyan-neon">{form.format || '?'}</span> format with{' '}
                          <span className="text-cyan-neon">{form.maxTeams}</span> teams, fixtures will be auto-generated across your date range. You can reschedule after creation.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 5 */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400">Review your tournament before launching.</p>
                      <div className="glass rounded-xl overflow-hidden">
                        {[
                          ['Name', form.name || '—'],
                          ['Sport', form.sport || '—'],
                          ['Format', form.format || '—'],
                          ['Teams', String(form.maxTeams)],
                          ['Start', form.startDate || '—'],
                          ['End', form.endDate || '—'],
                          ['Venue', form.venue || '—'],
                          ['Prize Pool', form.prizePool || 'None'],
                          ['Entry Fee', form.entryFee || 'Free'],
                        ].map(([l, v], i, arr) => (
                          <div key={l} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                            <span className="text-xs text-gray-500">{l}</span>
                            <span className={`text-sm font-medium ${v === '—' ? 'text-gray-600' : 'text-white'}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <NeonButton variant="ghost" size="md" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                <ChevronLeft size={16} /> Back
              </NeonButton>
              {step < STEPS.length - 1 ? (
                <NeonButton variant="cyan" size="md" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                  Next <ChevronRight size={16} />
                </NeonButton>
              ) : (
                <NeonButton variant="lime" size="md" onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : '🚀 Launch Tournament'}
                </NeonButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
