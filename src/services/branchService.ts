import { API_URL } from '../config/env'

export type BranchPayload = {
  name: string
  address: string
  city: string
  state: string
  country: string
}

export type Branch = BranchPayload & {
  id: number
  created_at?: string
}

export type BranchListFilters = {
  name?: string
  city?: string
  state?: string
  country?: string
}

export type BranchPaginatedResponse = {
  items: Branch[]
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
  const token = getAuthToken()
  return {
    Authorization: `Bearer ${token}`,
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

const normalizeBranch = (value: unknown): Branch | null => {
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
    address: typeof obj.address === 'string' ? obj.address : '',
    city: typeof obj.city === 'string' ? obj.city : '',
    state: typeof obj.state === 'string' ? obj.state : '',
    country: typeof obj.country === 'string' ? obj.country : '',
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
  }
}

const normalizeBranchList = (value: unknown): Branch[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeBranch).filter((item): item is Branch => item !== null)
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizeBranch).filter((item): item is Branch => item !== null)
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeBranch).filter((item): item is Branch => item !== null)
    }
  }

  return []
}

export const branchService = {
  async getBranches(): Promise<Branch[]> {
    const response = await fetch(`${API_URL}/branches`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeBranchList(data)
  },

  async getBranchById(id: number): Promise<Branch> {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    const branch = normalizeBranch(data)
    if (!branch) {
      throw new Error('Invalid branch response.')
    }

    return branch
  },

  async getBranchesPaginated(page: number, size: number, filters: BranchListFilters = {}): Promise<BranchPaginatedResponse> {
    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('size', String(size))
    if (filters.name?.trim()) query.set('name', filters.name.trim())
    if (filters.city?.trim()) query.set('city', filters.city.trim())
    if (filters.state?.trim()) query.set('state', filters.state.trim())
    if (filters.country?.trim()) query.set('country', filters.country.trim())

    const response = await fetch(`${API_URL}/branches/paginated?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const raw = (await response.json()) as unknown
    const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    const items = normalizeBranchList(obj.items ?? [])
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

  async createBranch(payload: BranchPayload): Promise<Branch | null> {
    const response = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeBranch(data)
  },

  async updateBranch(id: number, payload: BranchPayload): Promise<Branch | null> {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeBranch(data)
  },

  async deleteBranch(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }
  },
}
