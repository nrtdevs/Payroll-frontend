import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type EmploymentTypePayload = {
  name: string
}

export type EmploymentType = EmploymentTypePayload & {
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

const normalizeEmploymentType = (value: unknown): EmploymentType | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const rawId = obj.id
  const id = typeof rawId === 'number' ? rawId : typeof rawId === 'string' ? Number(rawId) : NaN
  if (!Number.isFinite(id)) return null

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
  }
}

const normalizeEmploymentTypeList = (value: unknown): EmploymentType[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeEmploymentType).filter((item): item is EmploymentType => item !== null)
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizeEmploymentType).filter((item): item is EmploymentType => item !== null)
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeEmploymentType).filter((item): item is EmploymentType => item !== null)
    }
  }

  return []
}

export const employmentTypeService = {
  async createEmploymentType(payload: EmploymentTypePayload): Promise<EmploymentType | null> {
    const response = await fetch(`${API_URL}/employment-types`, {
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
    return normalizeEmploymentType(data)
  },

  async getEmploymentTypes(): Promise<EmploymentType[]> {
    const response = await fetch(`${API_URL}/employment-types`, {
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
    return normalizeEmploymentTypeList(data)
  },

  async getEmploymentTypeById(id: number): Promise<EmploymentType> {
    const response = await fetch(`${API_URL}/employment-types/${id}`, {
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
    const employmentType = normalizeEmploymentType(data)
    if (!employmentType) {
      throw new Error('Invalid employment type response.')
    }

    return employmentType
  },

  async updateEmploymentType(id: number, payload: EmploymentTypePayload): Promise<EmploymentType | null> {
    const response = await fetch(`${API_URL}/employment-types/${id}`, {
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
    return normalizeEmploymentType(data)
  },

  async deleteEmploymentType(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/employment-types/${id}`, {
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
