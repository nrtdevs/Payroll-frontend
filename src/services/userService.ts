import { API_URL } from '../config/env'

export type User = {
  id: number
  username?: string | null
  email?: string | null
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  role?: string | null
  business_id?: number | null
  name?: string | null
  branch_id?: number | null
  role_id?: number | null
  salary_type?: string | null
  salary?: number | string | null
  leave_balance?: number | null
  status?: string | null
  current_address?: string | null
  home_address?: string | null
  pan?: string | null
  aadhaar?: string | null
  mobile?: string | null
  number?: string | null
  father_name?: string | null
  mother_name?: string | null
  created_at?: string | null
}

export type UserPayload = {
  name: string
  branch_id: number | null
  role_id: number | null
  salary_type: string
  salary: number | null
  leave_balance: number | null
  status: string
  current_address: string
  home_address: string
  pan: string
  aadhaar: string
  mobile: string
  number: string
  email: string
  father_name: string
  mother_name: string
  business_id: number | null
}

export type CreateUserPayload = UserPayload & {
  password: string
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

const normalizeUser = (value: unknown): User | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) {
    return null
  }

  return {
    id,
    username: (obj.username as string | null | undefined) ?? null,
    email: (obj.email as string | null | undefined) ?? null,
    first_name: (obj.first_name as string | null | undefined) ?? null,
    middle_name: (obj.middle_name as string | null | undefined) ?? null,
    last_name: (obj.last_name as string | null | undefined) ?? null,
    role: (obj.role as string | null | undefined) ?? null,
    business_id: toNumberOrNull(obj.business_id),
    name: (obj.name as string | null | undefined) ?? null,
    branch_id: toNumberOrNull(obj.branch_id),
    role_id: toNumberOrNull(obj.role_id),
    salary_type: (obj.salary_type as string | null | undefined) ?? null,
    salary: (obj.salary as number | string | null | undefined) ?? null,
    leave_balance: toNumberOrNull(obj.leave_balance),
    status: (obj.status as string | null | undefined) ?? null,
    current_address: (obj.current_address as string | null | undefined) ?? null,
    home_address: (obj.home_address as string | null | undefined) ?? null,
    pan: (obj.pan as string | null | undefined) ?? null,
    aadhaar: (obj.aadhaar as string | null | undefined) ?? null,
    mobile: (obj.mobile as string | null | undefined) ?? null,
    number: (obj.number as string | null | undefined) ?? null,
    father_name: (obj.father_name as string | null | undefined) ?? null,
    mother_name: (obj.mother_name as string | null | undefined) ?? null,
    created_at: (obj.created_at as string | null | undefined) ?? null,
  }
}

const normalizeUserList = (value: unknown): User[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(normalizeUser).filter((user): user is User => user !== null)
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeUserList(data)
  },

  async createUser(payload: CreateUserPayload): Promise<User | null> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeUser(data)
  },

  async updateUser(id: number, payload: UserPayload): Promise<User | null> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeUser(data)
  },

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }
  },
}
