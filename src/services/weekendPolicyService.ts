import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type WeekendRulePayload = {
  day_of_week: number
  week_number: number | null
}

export type WeekendPolicyPayload = {
  session_id: number
  name: string
  branch_id: number | null
  effective_from?: string
  effective_to?: string | null
  rules: WeekendRulePayload[]
}

export type WeekendPolicyUpdatePayload = {
  name?: string
  branch_id?: number | null
  is_active?: boolean
  rules?: WeekendRulePayload[]
}

export type WeekendPolicyRule = {
  id: number
  day_of_week: number
  week_number: number | null
}

export type WeekendPolicy = {
  id: number
  session_id: number
  session_name: string
  name: string
  branch_id: number | null
  effective_from: string | null
  effective_to: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  rules: WeekendPolicyRule[]
}

export type WeekendCheckResponse = {
  is_weekend: boolean
  session_id: number | null
  policy_id: number | null
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
  if (Array.isArray(detail)) {
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
    if (messages.length > 0) return messages.join(' | ')
  }
  return null
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { detail?: unknown; message?: string }
    const detailMessage = parseFastApiDetail(data.detail)
    return detailMessage || data.message || `Request failed (${response.status}).`
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

const normalizeRule = (value: unknown): WeekendPolicyRule | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  const day = toNumberOrNull(obj.day_of_week)
  if (id === null || day === null) return null
  return {
    id,
    day_of_week: day,
    week_number: toNumberOrNull(obj.week_number),
  }
}

const normalizePolicy = (value: unknown): WeekendPolicy | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  const sessionId = toNumberOrNull(obj.session_id)
  if (id === null || sessionId === null) return null

  const rulesRaw = Array.isArray(obj.rules) ? obj.rules : []
  return {
    id,
    session_id: sessionId,
    session_name: typeof obj.session_name === 'string' ? obj.session_name : '',
    name: typeof obj.name === 'string' ? obj.name : '',
    branch_id: toNumberOrNull(obj.branch_id),
    effective_from: typeof obj.effective_from === 'string' ? obj.effective_from : null,
    effective_to: typeof obj.effective_to === 'string' ? obj.effective_to : null,
    is_active: Boolean(obj.is_active),
    created_at: typeof obj.created_at === 'string' ? obj.created_at : '',
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : '',
    rules: rulesRaw.map(normalizeRule).filter((item): item is WeekendPolicyRule => item !== null),
  }
}

const normalizePolicyList = (value: unknown): WeekendPolicy[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizePolicy).filter((item): item is WeekendPolicy => item !== null)
}

export const weekendPolicyService = {
  async createPolicy(payload: WeekendPolicyPayload): Promise<WeekendPolicy | null> {
    const response = await fetch(`${API_URL}/weekend-policies`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizePolicy((await response.json()) as unknown)
  },

  async listPolicies(branchId?: number | null): Promise<WeekendPolicy[]> {
    const query = new URLSearchParams()
    if (branchId !== undefined && branchId !== null) {
      query.set('branch_id', String(branchId))
    }
    const response = await fetch(`${API_URL}/weekend-policies${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizePolicyList((await response.json()) as unknown)
  },

  async getPolicyById(id: number): Promise<WeekendPolicy> {
    const response = await fetch(`${API_URL}/weekend-policies/${id}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    const policy = normalizePolicy((await response.json()) as unknown)
    if (!policy) throw new Error('Invalid weekend policy response.')
    return policy
  },

  async updatePolicy(id: number, payload: WeekendPolicyUpdatePayload): Promise<WeekendPolicy | null> {
    const response = await fetch(`${API_URL}/weekend-policies/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizePolicy((await response.json()) as unknown)
  },

  async deletePolicy(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/weekend-policies/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
  },

  async checkDate(dateValue: string, branchId: number): Promise<WeekendCheckResponse> {
    const query = new URLSearchParams()
    query.set('date', dateValue)
    query.set('branch_id', String(branchId))

    const response = await fetch(`${API_URL}/weekend-policies/check?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))

    const data = (await response.json()) as Record<string, unknown>
    return {
      is_weekend: Boolean(data.is_weekend),
      session_id: toNumberOrNull(data.session_id),
      policy_id: toNumberOrNull(data.policy_id),
    }
  },
}
