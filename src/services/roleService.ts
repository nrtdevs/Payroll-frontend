import { API_URL } from '../config/env'

export type Role = {
  id: number
  name: string
  created_at?: string
}

type CreateRolePayload = {
  name: string
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

const normalizeRole = (value: unknown): Role | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const obj = value as Record<string, unknown>
  const rawId = obj.id
  const id = typeof rawId === 'number' ? rawId : typeof rawId === 'string' ? Number(rawId) : NaN
  if (!Number.isFinite(id)) {
    return null
  }

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
  }
}

const normalizeRoleList = (value: unknown): Role[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(normalizeRole).filter((role): role is Role => role !== null)
}

export const roleService = {
  async getRoles(): Promise<Role[]> {
    const response = await fetch(`${API_URL}/roles`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeRoleList(data)
  },

  async createRole(payload: CreateRolePayload): Promise<Role | null> {
    const response = await fetch(`${API_URL}/roles`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeRole(data)
  },

  async deleteRole(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }
  },
}
