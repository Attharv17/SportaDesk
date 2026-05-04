import axios from 'axios'
import type { Tournament, Match, CreateTournamentForm, DashboardStats, User, UserRole } from '../types'

// ─── Re-exported for backwards-compat from lib/api ────────────────────────────
// Old import path: '../lib/api'  →  New canonical path: '../services/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('sportsdesk-auth')
      if (raw) {
        const token = JSON.parse(raw)?.state?.token
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch {
      // ignore parsing errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error format to match the old fetch behavior
    const message = error.response?.data?.error ?? error.response?.statusText ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// A helper wrapper to keep existing functions exactly the same
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body as string) : undefined;
  
  const response = await api.request<T>({
    url: path,
    method,
    data,
  });
  
  return response.data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string
  user: User & { createdAt: string }
}
export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export const apiLogin = (email: string, password: string) =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

export const apiRegister = (payload: RegisterPayload) =>
  request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) })

export const apiLogout = () =>
  request<{ message: string }>('/api/auth/logout', { method: 'POST' })

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const apiGetStats = () =>
  request<DashboardStats & { totalTournaments: number }>('/api/dashboard/stats')

// ─── Tournaments ──────────────────────────────────────────────────────────────
export interface TournamentQueryParams {
  search?: string
  sport?: string
  status?: string
  page?: number
  limit?: number
  organizerId?: string
}
export interface PaginatedTournaments {
  data: Tournament[]
  total: number
  page: number
  limit: number
}

export const apiGetTournaments = (params: TournamentQueryParams = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  ) as Record<string, string>
  const qs = new URLSearchParams(clean).toString()
  return request<PaginatedTournaments>(`/api/tournaments${qs ? `?${qs}` : ''}`)
}

export const apiGetTournament = (id: string) =>
  request<Tournament>(`/api/tournaments/${id}`)

export const apiCreateTournament = (form: CreateTournamentForm) =>
  request<Tournament>('/api/organizer/tournaments', {
    method: 'POST',
    body: JSON.stringify({
      name:        form.name,
      sport:       form.sport,
      description: form.description,
      format:      form.format,
      maxTeams:    form.maxTeams,
      startDate:   form.startDate,
      endDate:     form.endDate,
      venue:       form.venue,
      prizePool:   form.prizePool,
      entryFee:    form.entryFee,
      teamNames:   form.teamNames.filter(Boolean),
    }),
  })

export const apiGetOrganizerTournaments = (params: TournamentQueryParams = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  ) as Record<string, string>
  const qs = new URLSearchParams(clean).toString()
  return request<PaginatedTournaments>(`/api/organizer/tournaments${qs ? `?${qs}` : ''}`)
}

export const apiUpdateTournament = (id: string, payload: Partial<Tournament>) =>
  request<Tournament>(`/api/organizer/tournaments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const apiDeleteTournament = (id: string) =>
  request<{ message: string }>(`/api/organizer/tournaments/${id}`, {
    method: 'DELETE',
  })

// ─── Matches ──────────────────────────────────────────────────────────────────
export const apiGetLiveMatches = (tournamentId?: string) =>
  request<{ data: Match[] }>(
    `/api/matches/live${tournamentId ? `?tournamentId=${tournamentId}` : ''}`
  )

export const apiGetTournamentMatches = (id: string, status?: string) =>
  request<{ data: Match[] }>(`/api/tournaments/${id}/matches${status ? `?status=${status}` : ''}`)

export const apiGetTournamentStandings = (id: string) =>
  request<{ data: unknown[] }>(`/api/tournaments/${id}/standings`)

export const apiGetTournamentBracket = (id: string) =>
  request<{ data: unknown[] }>(`/api/tournaments/${id}/bracket`)

// ─── Manager ──────────────────────────────────────────────────────────────────
export interface Team {
  id: string
  name: string
  logo?: string
  color: string
  managerId: string
  createdAt: string
  players: any[]
  tournaments: any[]
}

export const apiGetManagerTeams = () =>
  request<{ data: Team[] }>('/api/manager/teams')

export const apiCreateManagerTeam = (name: string, color?: string, logo?: string) =>
  request<Team>('/api/manager/teams', {
    method: 'POST',
    body: JSON.stringify({ name, color, logo }),
  })

export const apiUpdateManagerTeam = (id: string, payload: Partial<Team>) =>
  request<Team>(`/api/manager/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const apiDeleteManagerTeam = (id: string) =>
  request<{ message: string }>(`/api/manager/teams/${id}`, {
    method: 'DELETE',
  })

export const apiAddManagerPlayer = (teamId: string, payload: any) =>
  request(`/api/manager/teams/${teamId}/players`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const apiRemoveManagerPlayer = (teamId: string, playerId: string) =>
  request(`/api/manager/teams/${teamId}/players/${playerId}`, {
    method: 'DELETE',
  })

export const apiGetManagerMatches = () =>
  request<{ data: Match[] }>('/api/manager/matches')

// ─── Player ───────────────────────────────────────────────────────────────────
export interface PlayerProfile {
  id: string
  name: string
  position?: string
  jerseyNumber?: number
  email: string
  avatar?: string
  memberSince: string
  team: {
    id: string
    name: string
    color: string
    logo?: string
    teammates: { id: string; name: string; position?: string; jerseyNumber?: number }[]
    tournaments: {
      id: string
      name: string
      sport: string
      status: string
      startDate: string
      endDate: string
    }[]
  }
}

export interface PlayerMatch {
  id: string
  status: string
  scheduledAt: string
  venue?: string
  round?: string
  tournamentName: string
  sport: string
  homeTeam: { id: string; name: string; color: string }
  awayTeam: { id: string; name: string; color: string }
  isHome: boolean
  result: 'win' | 'loss' | 'draw' | null
  score: { home: string | number | null; away: string | number | null }
}

export const apiGetPlayerProfile = () =>
  request<{ data: PlayerProfile }>('/api/player/profile')

export const apiGetPlayerMatches = () =>
  request<{ data: PlayerMatch[] }>('/api/player/matches')
