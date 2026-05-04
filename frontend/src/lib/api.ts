import type { Tournament, Match, CreateTournamentForm, DashboardStats, User, UserRole } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

// Read JWT from persisted Zustand store in localStorage
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('sportsdesk-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.token ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? res.statusText ?? 'Request failed')
  return data as T
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
  request<Tournament>('/api/tournaments', {
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
