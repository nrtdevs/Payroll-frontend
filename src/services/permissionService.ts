import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type PermissionPayload = {
  permission_name: string
  group: string
  description: string
}

export type Permission = PermissionPayload & {
  id: number
  created_at?: string
}

export type PermissionListFilters = {
  name?: string
  group?: string
}

export type PermissionPaginatedResponse = {
  items: Permission[]
  page: number
  size: number
  total: number
  total_pages: number
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

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
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

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizePermission(data)
  },

  async getPermissionsPaginated(page: number, size: number, filters: PermissionListFilters = {}): Promise<PermissionPaginatedResponse> {
    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('size', String(size))
    if (filters.name?.trim()) query.set('name', filters.name.trim())
    if (filters.group?.trim()) query.set('group', filters.group.trim())

    const response = await fetch(`${API_URL}/permissions/paginated?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const raw = (await response.json()) as unknown
    const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    const items = normalizePermissionList(obj.items ?? [])
    const rawPage = typeof obj.page === 'number' ? obj.page : Number(obj.page)
    const rawSize = typeof obj.size === 'number' ? obj.size : Number(obj.size)
    const rawTotal = typeof obj.total === 'number' ? obj.total : Number(obj.total)
    const rawTotalPages = typeof obj.total_pages === 'number' ? obj.total_pages : Number(obj.total_pages)

    return {
      items,
      page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : page,
      size: Number.isFinite(rawSize) && rawSize > 0 ? rawSize : size,
      total: Number.isFinite(rawTotal) && rawTotal >= 0 ? rawTotal : items.length,
      total_pages: Number.isFinite(rawTotalPages) && rawTotalPages >= 0 ? rawTotalPages : 0,
    }
  },

  async updatePermission(id: number, payload: PermissionPayload): Promise<Permission | null> {
    const response = await fetch(`${API_URL}/permissions/${id}`, {
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
    return normalizePermission(data)
  },

  async deletePermission(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/permissions/${id}`, {
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
