import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type SessionPayload = {
  name: string
  start_date: string
  end_date: string
  branch_id: number | null
  is_active: boolean
}

export type SessionRecord = {
  id: number
  name: string
  start_date: string
  end_date: string
  branch_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SessionUpdatePayload = {
  name?: string
  start_date?: string
  end_date?: string
  branch_id?: number | null
  is_active?: boolean
}

const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    throw new Error('Auth token not found. Please login again.')
  }
  return token
}

const authHeaders = (includeContentType: boolean): HeadersInit => {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
  }
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { detail?: string; message?: string }
    return data.detail || data.message || `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeSessionRecord = (value: unknown): SessionRecord | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) return null

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    start_date: typeof obj.start_date === 'string' ? obj.start_date : '',
    end_date: typeof obj.end_date === 'string' ? obj.end_date : '',
    branch_id: toNumberOrNull(obj.branch_id),
    is_active: Boolean(obj.is_active),
    created_at: typeof obj.created_at === 'string' ? obj.created_at : '',
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : '',
  }
}

const normalizeSessionList = (value: unknown): SessionRecord[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeSessionRecord).filter((item): item is SessionRecord => item !== null)
}

export const sessionService = {
  async createSession(payload: SessionPayload): Promise<SessionRecord | null> {
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeSessionRecord(data)
  },

  async listSessions(branchId?: number | null): Promise<SessionRecord[]> {
    const query = new URLSearchParams()
    if (branchId !== null && branchId !== undefined) {
      query.set('branch_id', String(branchId))
    }

    const queryString = query.toString()
    const response = await fetch(`${API_URL}/sessions${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeSessionList(data)
  },

  async updateSession(id: number, payload: SessionUpdatePayload): Promise<SessionRecord | null> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeSessionRecord(data)
  },

  async deleteSession(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }
  },
}
