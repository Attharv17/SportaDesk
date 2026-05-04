import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { sportConfig } from '../../lib/mockData'
import { apiGetLiveMatches } from '../../lib/api'
import type { Match } from '../../types'

const POLL_INTERVAL = 15_000   // re-fetch live scores every 15 s

export default function MatchTicker() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [index, setIndex] = useState(0)

  // Fetch on mount and poll on interval
  useEffect(() => {
    const load = () =>
      apiGetLiveMatches()
        .then((res) => setLiveMatches(res.data))
        .catch(console.error)

    load()
    const poll = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(poll)
  }, [])

  // Auto-cycle through live matches every 4 s
  useEffect(() => {
    if (liveMatches.length === 0) return
    const id = setInterval(() => setIndex((i) => (i + 1) % liveMatches.length), 4000)
    return () => clearInterval(id)
  }, [liveMatches.length])

  if (liveMatches.length === 0) return null

  const match = liveMatches[index]
  const sport = sportConfig[match.sport] ?? { icon: '🏆', color: '#a3ff00' }

  return (
    <div className="glass rounded-xl px-4 py-3 border border-lime-neon/20 overflow-hidden relative"
      style={{ boxShadow: '0 0 20px rgba(163,255,0,0.05)' }}>
      {/* Live Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-lime-neon animate-pulse" />
        <span className="text-xs font-bold text-lime-neon tracking-widest">LIVE MATCHES</span>
      </div>

      {/* Ticker Content */}
      <motion.div
        key={match.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <span className="text-sm">{sport.icon}</span>
        <span className="text-sm font-semibold text-white truncate">
          {match.homeTeam.name}
        </span>
        <span className="text-xs text-gray-500">vs</span>
        <span className="text-sm font-semibold text-white truncate">
          {match.awayTeam.name}
        </span>
        {match.score && match.sport === 'cricket' && (
          <span className="ml-auto text-xs font-mono text-cyan-neon whitespace-nowrap">
            {(match.score.home as any).runs}/{(match.score.home as any).wickets}
          </span>
        )}
        {match.score && match.sport === 'kabaddi' && (
          <span className="ml-auto text-xs font-mono text-lime-neon whitespace-nowrap">
            {(match.score.home as any).points} - {(match.score.away as any).points}
          </span>
        )}
      </motion.div>

      {/* Dot Indicators */}
      <div className="flex gap-1 mt-2">
        {liveMatches.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? 16 : 4,
              height: 4,
              backgroundColor: i === index ? '#a3ff00' : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
