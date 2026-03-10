import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type HolidayTypePayload = {
  name: string
  description: string
  is_paid: boolean
}

export type HolidayTypeUpdatePayload = {
  name?: string
  description?: string
  is_paid?: boolean
}

export type HolidayType = {
  id: number
  name: string
  description: string
  is_paid: boolean
  created_at?: string
  updated_at?: string
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

const parseFastApiDetail = (detail: unknown): string | null => {
  if (typeof detail === 'string' && detail.trim() !== '') return detail
  if (!Array.isArray(detail)) return null

  const messages = detail
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const msg = typeof obj.msg === 'string' ? obj.msg : null
      const loc = Array.isArray(obj.loc) ? obj.loc.filter((part) => typeof part === 'string' || typeof part === 'number').join('.') : null
      if (!msg) return null
      return loc ? `${loc}: ${msg}` : msg
    })
    .filter((item): item is string => Boolean(item))

  if (messages.length === 0) return null
  return messages.join(' | ')
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { detail?: unknown; message?: string }
    return parseFastApiDetail(data.detail) || data.message || `Request failed (${response.status}).`
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

const normalizeHolidayType = (value: unknown): HolidayType | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) return null

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    description: typeof obj.description === 'string' ? obj.description : '',
    is_paid: Boolean(obj.is_paid),
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  }
}

const normalizeHolidayTypeList = (value: unknown): HolidayType[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeHolidayType).filter((item): item is HolidayType => item !== null)
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizeHolidayType).filter((item): item is HolidayType => item !== null)
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeHolidayType).filter((item): item is HolidayType => item !== null)
    }
  }
  return []
}

export const holidayTypeService = {
  async createHolidayType(payload: HolidayTypePayload): Promise<HolidayType | null> {
    const response = await fetch(`${API_URL}/holiday-types`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeHolidayType((await response.json()) as unknown)
  },

  async getHolidayTypes(): Promise<HolidayType[]> {
    const response = await fetch(`${API_URL}/holiday-types`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeHolidayTypeList((await response.json()) as unknown)
  },

  async updateHolidayType(id: number, payload: HolidayTypeUpdatePayload): Promise<HolidayType | null> {
    const response = await fetch(`${API_URL}/holiday-types/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeHolidayType((await response.json()) as unknown)
  },

  async deleteHolidayType(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/holiday-types/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
  },
}
