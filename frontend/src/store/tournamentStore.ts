import { create } from 'zustand'
import type { Tournament, CreateTournamentForm } from '../types'
import { apiGetTournaments, apiCreateTournament, type TournamentQueryParams } from '../lib/api'

interface TournamentState {
  tournaments: Tournament[]
  currentTournament: Tournament | null
  loading: boolean
  error: string | null
  setCurrentTournament: (t: Tournament | null) => void
  fetchTournaments: (params?: TournamentQueryParams) => Promise<void>
  createTournament: (form: CreateTournamentForm) => Promise<Tournament>
  getTournamentById: (id: string) => Tournament | undefined
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments:        [],
  currentTournament:  null,
  loading:            false,
  error:              null,

  setCurrentTournament: (t) => set({ currentTournament: t }),

  fetchTournaments: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const result = await apiGetTournaments(params)
      set({ tournaments: result.data, loading: false })
    } catch (err: unknown) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createTournament: async (form) => {
    const tournament = await apiCreateTournament(form)
    set((s) => ({ tournaments: [tournament, ...s.tournaments] }))
    return tournament
  },

  getTournamentById: (id) => get().tournaments.find((t) => t.id === id),
}))
