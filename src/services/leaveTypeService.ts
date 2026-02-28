import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type LeaveTypePayload = {
  name: string
  description: string
  is_active: boolean
  proof_required: boolean
}

export type LeaveType = LeaveTypePayload & {
  id: number
  created_at?: string
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

const normalizeLeaveType = (value: unknown): LeaveType | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const rawId = obj.id
  const id = typeof rawId === 'number' ? rawId : typeof rawId === 'string' ? Number(rawId) : NaN
  if (!Number.isFinite(id)) return null

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    description: typeof obj.description === 'string' ? obj.description : '',
    is_active: Boolean(obj.is_active),
    proof_required: Boolean(obj.proof_required),
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
  }
}

const normalizeLeaveTypeList = (value: unknown): LeaveType[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeLeaveType).filter((item): item is LeaveType => item !== null)
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizeLeaveType).filter((item): item is LeaveType => item !== null)
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeLeaveType).filter((item): item is LeaveType => item !== null)
    }
  }

  return []
}

export const leaveTypeService = {
  async createLeaveType(payload: LeaveTypePayload): Promise<LeaveType | null> {
    const response = await fetch(`${API_URL}/leave-types`, {
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
    return normalizeLeaveType(data)
  },

  async getLeaveTypes(): Promise<LeaveType[]> {
    const response = await fetch(`${API_URL}/leave-types`, {
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
    return normalizeLeaveTypeList(data)
  },

  async getLeaveTypeById(id: number): Promise<LeaveType> {
    const response = await fetch(`${API_URL}/leave-types/${id}`, {
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
    const leaveType = normalizeLeaveType(data)
    if (!leaveType) {
      throw new Error('Invalid leave type response.')
    }

    return leaveType
  },

  async updateLeaveType(id: number, payload: LeaveTypePayload): Promise<LeaveType | null> {
    const response = await fetch(`${API_URL}/leave-types/${id}`, {
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
    return normalizeLeaveType(data)
  },

  async deleteLeaveType(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/leave-types/${id}`, {
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
