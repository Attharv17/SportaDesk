import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiRegister } from '../lib/api'
import PageWrapper from '../components/ui/PageWrapper'
import NeonButton from '../components/ui/NeonButton'
import type { UserRole } from '../types'

const roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'organizer',     label: 'Organizer',     icon: '🏟️', desc: 'Create & manage tournaments' },
  { value: 'team_manager',  label: 'Team Manager',  icon: '📋', desc: 'Manage your team roster' },
  { value: 'player',        label: 'Player',        icon: '⚡', desc: 'Track your performance' },
]

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('organizer')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) { setError('Please fill all fields'); return }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return }
    setLoading(true)
    setError('')
    try {
      const { user, token } = await apiRegister({ name, email, password, role })
      login(user, token)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <PageWrapper className="min-h-screen grid-bg flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Trophy size={32} className="text-cyan-neon" style={{ filter: 'drop-shadow(0 0 10px rgba(0,245,255,0.8))' }} />
            <span className="font-display font-bold text-2xl">
              <span className="text-gradient-cyan">Sports</span><span className="text-white">Desk</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Create account</h1>
          <p className="text-gray-500 text-sm">Join thousands of tournament organizers</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">I am a…</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-3 rounded-xl border text-center transition-all duration-200
                      ${role === r.value
                        ? 'border-cyan-neon/50 bg-cyan-neon/10 text-cyan-neon'
                        : 'border-white/8 bg-white/3 text-gray-500 hover:border-white/15'}`}
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="text-xs font-semibold">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-neon/50 focus:ring-1 focus:ring-cyan-neon/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-neon/50 focus:ring-1 focus:ring-cyan-neon/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 4 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-neon/50 focus:ring-1 focus:ring-cyan-neon/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <NeonButton type="submit" variant="cyan" size="lg" fullWidth disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">Create Account <ArrowRight size={16} /></span>
              )}
            </NeonButton>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-neon hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </PageWrapper>
  )
}
