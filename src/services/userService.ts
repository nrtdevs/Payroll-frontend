import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

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
  employment_type_id?: number | null
  designation_id?: number | null
  reporting_manager_id?: number | null
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
  bank_account?: UserBankAccountPayload | null
  educations?: UserEducation[] | null
  previous_companies?: UserPreviousCompany[] | null
  documents?: UserDocument[] | null
  created_at?: string | null
}

export type UserDocument = {
  id: number
  document_type: string
  original_filename: string
  content_type: string
  file_size: number
  created_at: string
}

export type UserEducation = {
  id: number
  degree: string
  institution: string
  year_of_passing: number | null
  percentage: string | number | null
  documents: UserDocument[]
}

export type UserPreviousCompany = {
  id: number
  company_name: string
  designation: string
  start_date: string
  end_date: string
  documents: UserDocument[]
}

export type UserHierarchyNode = {
  id: number
  name: string
  email: string
  role: string
  designation_id: number | null
  reporting_manager_id: number | null
  profile_image_document_id: number | null
  profile_image_url: string | null
  children: UserHierarchyNode[]
}

export type UserPayload = {
  name: string
  branch_id: number | null
  employment_type_id: number | null
  designation_id: number | null
  reporting_manager_id: number | null
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
  business_id?: number | null
}

export type CreateUserPayload = UserPayload & {
  password: string
}

export type UserBankAccountPayload = {
  account_holder_name: string
  account_number: string
  ifsc_code: string
  bank_name: string
}

export type UserEducationPayload = {
  record_key: string
  degree: string
  institution: string
  year_of_passing: number | null
  percentage: number | null
}

export type UserPreviousCompanyPayload = {
  record_key: string
  company_name: string
  designation: string
  start_date: string
  end_date: string
}

export type CreateUserRequest = {
  payload: CreateUserPayload & UserNestedPayload
  education_file_map?: Record<string, number[]>
  company_file_map?: Record<string, number[]>
  files?: {
    profile_image?: File | null
    aadhaar_copy?: File | null
    pan_copy?: File | null
    bank_proof?: File | null
    education_marksheets?: File[]
    experience_proofs?: File[]
  }
}

export type UserNestedPayload = {
  bank_account: UserBankAccountPayload
  educations: UserEducationPayload[]
  previous_companies: UserPreviousCompanyPayload[]
}

export type UpdateUserRequest = {
  payload: UserPayload & UserNestedPayload
  education_file_map?: Record<string, number[]>
  company_file_map?: Record<string, number[]>
  files?: {
    profile_image?: File | null
    aadhaar_copy?: File | null
    pan_copy?: File | null
    bank_proof?: File | null
    education_marksheets?: File[]
    experience_proofs?: File[]
  }
}

export type UserListFilters = {
  first_name?: string
  mobile_number?: string
  branch_id?: number | null
}

export type UserPaginatedResponse = {
  items: User[]
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
    employment_type_id: toNumberOrNull(obj.employment_type_id),
    designation_id: toNumberOrNull(obj.designation_id),
    reporting_manager_id: toNumberOrNull(obj.reporting_manager_id),
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
    bank_account: normalizeBankAccount(obj.bank_account),
    educations: normalizeEducations(obj.educations),
    previous_companies: normalizePreviousCompanies(obj.previous_companies),
    documents: normalizeDocuments(obj.documents),
    created_at: (obj.created_at as string | null | undefined) ?? null,
  }
}

const normalizeDocuments = (value: unknown): UserDocument[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const id = toNumberOrNull(obj.id)
      if (id === null) return null
      return {
        id,
        document_type: String(obj.document_type ?? ''),
        original_filename: String(obj.original_filename ?? ''),
        content_type: String(obj.content_type ?? ''),
        file_size: toNumberOrNull(obj.file_size) ?? 0,
        created_at: String(obj.created_at ?? ''),
      }
    })
    .filter((doc): doc is UserDocument => doc !== null)
}

const normalizeBankAccount = (value: unknown): UserBankAccountPayload | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  return {
    account_holder_name: String(obj.account_holder_name ?? ''),
    account_number: String(obj.account_number ?? ''),
    ifsc_code: String(obj.ifsc_code ?? ''),
    bank_name: String(obj.bank_name ?? ''),
  }
}

const normalizeEducations = (value: unknown): UserEducation[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const id = toNumberOrNull(obj.id)
      if (id === null) return null
      return {
        id,
        degree: String(obj.degree ?? ''),
        institution: String(obj.institution ?? ''),
        year_of_passing: toNumberOrNull(obj.year_of_passing),
        percentage: (obj.percentage as string | number | null | undefined) ?? null,
        documents: normalizeDocuments(obj.documents),
      }
    })
    .filter((education): education is UserEducation => education !== null)
}

const normalizePreviousCompanies = (value: unknown): UserPreviousCompany[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const id = toNumberOrNull(obj.id)
      if (id === null) return null
      return {
        id,
        company_name: String(obj.company_name ?? ''),
        designation: String(obj.designation ?? ''),
        start_date: String(obj.start_date ?? ''),
        end_date: String(obj.end_date ?? ''),
        documents: normalizeDocuments(obj.documents),
      }
    })
    .filter((company): company is UserPreviousCompany => company !== null)
}

const normalizeUserList = (value: unknown): User[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(normalizeUser).filter((user): user is User => user !== null)
}

const normalizeHierarchyNode = (value: unknown): UserHierarchyNode | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) return null

  const rawChildren = Array.isArray(obj.children) ? obj.children : []
  const children = rawChildren.map(normalizeHierarchyNode).filter((item): item is UserHierarchyNode => item !== null)

  return {
    id,
    name: String(obj.name ?? ''),
    email: String(obj.email ?? ''),
    role: String(obj.role ?? ''),
    designation_id: toNumberOrNull(obj.designation_id),
    reporting_manager_id: toNumberOrNull(obj.reporting_manager_id),
    profile_image_document_id: toNumberOrNull(obj.profile_image_document_id),
    profile_image_url: obj.profile_image_url ? String(obj.profile_image_url) : null,
    children,
  }
}

const normalizeHierarchyList = (value: unknown): UserHierarchyNode[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeHierarchyNode).filter((item): item is UserHierarchyNode => item !== null)
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`, {
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
    return normalizeUserList(data)
  },

  async createUser(request: CreateUserRequest): Promise<User | null> {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(request.payload))
    formData.append('education_file_map', JSON.stringify(request.education_file_map ?? {}))
    formData.append('company_file_map', JSON.stringify(request.company_file_map ?? {}))

    if (request.files?.profile_image) {
      formData.append('profile_image', request.files.profile_image)
    }
    if (request.files?.aadhaar_copy) {
      formData.append('aadhaar_copy', request.files.aadhaar_copy)
    }
    if (request.files?.pan_copy) {
      formData.append('pan_copy', request.files.pan_copy)
    }
    if (request.files?.bank_proof) {
      formData.append('bank_proof', request.files.bank_proof)
    }
    request.files?.education_marksheets?.forEach((file) => formData.append('education_marksheets', file))
    request.files?.experience_proofs?.forEach((file) => formData.append('experience_proofs', file))

    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: authHeaders(false),
      body: formData,
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeUser(data)
  },

  async updateUser(id: number, request: UpdateUserRequest): Promise<User | null> {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(request.payload))
    formData.append('education_file_map', JSON.stringify(request.education_file_map ?? {}))
    formData.append('company_file_map', JSON.stringify(request.company_file_map ?? {}))

    if (request.files?.profile_image) {
      formData.append('profile_image', request.files.profile_image)
    }
    if (request.files?.aadhaar_copy) {
      formData.append('aadhaar_copy', request.files.aadhaar_copy)
    }
    if (request.files?.pan_copy) {
      formData.append('pan_copy', request.files.pan_copy)
    }
    if (request.files?.bank_proof) {
      formData.append('bank_proof', request.files.bank_proof)
    }
    request.files?.education_marksheets?.forEach((file) => formData.append('education_marksheets', file))
    request.files?.experience_proofs?.forEach((file) => formData.append('experience_proofs', file))

    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: authHeaders(false),
      body: formData,
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as unknown
    return normalizeUser(data)
  },

  async getUsersPaginated(page: number, size: number, filters: UserListFilters = {}): Promise<UserPaginatedResponse> {
    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('size', String(size))
    if (filters.first_name?.trim()) query.set('first_name', filters.first_name.trim())
    if (filters.mobile_number?.trim()) query.set('mobile_number', filters.mobile_number.trim())
    if (filters.branch_id !== null && filters.branch_id !== undefined) query.set('branch_id', String(filters.branch_id))

    const response = await fetch(`${API_URL}/users/paginated?${query.toString()}`, {
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
    const items = normalizeUserList(obj.items ?? [])
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

  async getHierarchy(): Promise<UserHierarchyNode[]> {
    const response = await fetch(`${API_URL}/users/hierarchy`, {
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
    return normalizeHierarchyList(data)
  },

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/users/${id}`, {
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
