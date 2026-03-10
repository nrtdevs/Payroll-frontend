import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type HolidayCreatePayload = {
  name: string
  holiday_date: string
  holiday_type_id: number
  branch_id: number | null
  session_id: number
  description: string
  is_optional: boolean
}

export type HolidayUpdatePayload = {
  description?: string
  is_optional?: boolean
}

export type Holiday = {
  id: number
  name: string
  holiday_date: string
  holiday_type_id: number | null
  holiday_type_name: string
  branch_id: number | null
  session_id: number | null
  description: string
  is_optional: boolean
  created_at?: string
  updated_at?: string
}

export type HolidayCheckResponse = {
  is_holiday: boolean
  holiday_id: number | null
  holiday_name: string | null
}

const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token')
  if (!token) throw new Error('Auth token not found. Please login again.')
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
  return messages.length > 0 ? messages.join(' | ') : null
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

const normalizeHoliday = (value: unknown): Holiday | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) return null
  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    holiday_date: typeof obj.holiday_date === 'string' ? obj.holiday_date : '',
    holiday_type_id: toNumberOrNull(obj.holiday_type_id),
    holiday_type_name: typeof obj.holiday_type_name === 'string' ? obj.holiday_type_name : '',
    branch_id: toNumberOrNull(obj.branch_id),
    session_id: toNumberOrNull(obj.session_id),
    description: typeof obj.description === 'string' ? obj.description : '',
    is_optional: Boolean(obj.is_optional),
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  }
}

const normalizeHolidayList = (value: unknown): Holiday[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeHoliday).filter((item): item is Holiday => item !== null)
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items.map(normalizeHoliday).filter((item): item is Holiday => item !== null)
    if (Array.isArray(obj.data)) return obj.data.map(normalizeHoliday).filter((item): item is Holiday => item !== null)
  }
  return []
}

export const holidayService = {
  async createHoliday(payload: HolidayCreatePayload): Promise<Holiday | null> {
    const response = await fetch(`${API_URL}/holidays`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeHoliday((await response.json()) as unknown)
  },

  async listHolidays(sessionId?: number | null, year?: number | null): Promise<Holiday[]> {
    const query = new URLSearchParams()
    if (sessionId !== null && sessionId !== undefined) query.set('session_id', String(sessionId))
    if (year !== null && year !== undefined) query.set('year', String(year))
    const response = await fetch(`${API_URL}/holidays${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeHolidayList((await response.json()) as unknown)
  },

  async getHolidayById(id: number): Promise<Holiday> {
    const response = await fetch(`${API_URL}/holidays/${id}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    const holiday = normalizeHoliday((await response.json()) as unknown)
    if (!holiday) throw new Error('Invalid holiday response.')
    return holiday
  },

  async updateHoliday(id: number, payload: HolidayUpdatePayload): Promise<Holiday | null> {
    const response = await fetch(`${API_URL}/holidays/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeHoliday((await response.json()) as unknown)
  },

  async deleteHoliday(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/holidays/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
  },

  async checkHoliday(date: string, branchId: number): Promise<HolidayCheckResponse> {
    const query = new URLSearchParams()
    query.set('date', date)
    query.set('branch_id', String(branchId))
    const response = await fetch(`${API_URL}/holidays/check?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    const data = (await response.json()) as Record<string, unknown>
    return {
      is_holiday: Boolean(data.is_holiday),
      holiday_id: toNumberOrNull(data.holiday_id),
      holiday_name: typeof data.holiday_name === 'string' ? data.holiday_name : null,
    }
  },
}
