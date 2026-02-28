import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type DesignationPayload = {
  name: string
  description: string
  is_active: boolean
}

export type Designation = DesignationPayload & {
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

const normalizeDesignation = (value: unknown): Designation | null => {
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
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
  }
}

const normalizeDesignationList = (value: unknown): Designation[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeDesignation).filter((item): item is Designation => item !== null)
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizeDesignation).filter((item): item is Designation => item !== null)
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeDesignation).filter((item): item is Designation => item !== null)
    }
  }

  return []
}

export const designationService = {
  async createDesignation(payload: DesignationPayload): Promise<Designation | null> {
    const response = await fetch(`${API_URL}/designations`, {
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
    return normalizeDesignation(data)
  },

  async getDesignations(): Promise<Designation[]> {
    const response = await fetch(`${API_URL}/designations`, {
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
    return normalizeDesignationList(data)
  },

  async getDesignationById(id: number): Promise<Designation> {
    const response = await fetch(`${API_URL}/designations/${id}`, {
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
    const designation = normalizeDesignation(data)
    if (!designation) {
      throw new Error('Invalid designation response.')
    }

    return designation
  },

  async updateDesignation(id: number, payload: DesignationPayload): Promise<Designation | null> {
    const response = await fetch(`${API_URL}/designations/${id}`, {
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
    return normalizeDesignation(data)
  },

  async deleteDesignation(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/designations/${id}`, {
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
