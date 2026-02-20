import { API_URL } from '../config/env'

export type PermissionPayload = {
  permission_name: string
  group: string
  description: string
}

export type Permission = PermissionPayload & {
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

const normalizePermission = (value: unknown): Permission | null => {
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
    permission_name: typeof obj.permission_name === 'string' ? obj.permission_name : '',
    group: typeof obj.group === 'string' ? obj.group : '',
    description: typeof obj.description === 'string' ? obj.description : '',
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
  }
}

const normalizePermissionList = (value: unknown): Permission[] => {
  if (Array.isArray(value)) {
    return value.map(normalizePermission).filter((item): item is Permission => item !== null)
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizePermission).filter((item): item is Permission => item !== null)
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizePermission).filter((item): item is Permission => item !== null)
    }
  }

  return []
}

export const permissionService = {
  async getPermissions(): Promise<Permission[]> {
    const response = await fetch(`${API_URL}/permissions`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizePermissionList(data)
  },

  async createPermission(payload: PermissionPayload): Promise<Permission | null> {
    const response = await fetch(`${API_URL}/permissions`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizePermission(data)
  },

  async updatePermission(id: number, payload: PermissionPayload): Promise<Permission | null> {
    const response = await fetch(`${API_URL}/permissions/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizePermission(data)
  },

  async deletePermission(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/permissions/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }
  },
}
