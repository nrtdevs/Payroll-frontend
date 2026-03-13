import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type CompanyProfilePayload = {
  company_name: string
  legal_name: string
  pan_number: string
  tan_number: string
  gst_number: string
  pf_number: string
  esi_number: string
  email: string
  phone: string
  website: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  country: string
  pincode: string
}

export type CompanyProfile = CompanyProfilePayload & {
  id?: number
  logo_url?: string
  created_at?: string
  updated_at?: string
}

const emptyString = (value: unknown): string => (typeof value === 'string' ? value : '')

const normalizeCompany = (value: unknown): CompanyProfile => {
  const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const rawId = obj.id
  const id = typeof rawId === 'number' ? rawId : typeof rawId === 'string' ? Number(rawId) : NaN

  return {
    id: Number.isFinite(id) ? id : undefined,
    company_name: emptyString(obj.company_name),
    legal_name: emptyString(obj.legal_name),
    pan_number: emptyString(obj.pan_number),
    tan_number: emptyString(obj.tan_number),
    gst_number: emptyString(obj.gst_number),
    pf_number: emptyString(obj.pf_number),
    esi_number: emptyString(obj.esi_number),
    email: emptyString(obj.email),
    phone: emptyString(obj.phone),
    website: emptyString(obj.website),
    address_line1: emptyString(obj.address_line1),
    address_line2: emptyString(obj.address_line2),
    city: emptyString(obj.city),
    state: emptyString(obj.state),
    country: emptyString(obj.country),
    pincode: emptyString(obj.pincode),
    logo_url: emptyString(obj.logo_url || obj.logo),
    created_at: emptyString(obj.created_at) || undefined,
    updated_at: emptyString(obj.updated_at) || undefined,
  }
}

const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    throw new Error('Auth token not found. Please login again.')
  }
  return token
}

const authHeaders = (includeContentType: boolean): HeadersInit => ({
  Authorization: `Bearer ${getAuthToken()}`,
  ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
})

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { detail?: string; message?: string }
    return data.detail || data.message || `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

const request = async (url: string, init: RequestInit): Promise<Response> => {
  const response = await fetch(url, init)
  if (handleUnauthorizedResponse(response)) {
    throw new Error(SESSION_TIMEOUT_MESSAGE)
  }
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return response
}

export const companyService = {
  emptyCompany(): CompanyProfilePayload {
    return {
      company_name: '',
      legal_name: '',
      pan_number: '',
      tan_number: '',
      gst_number: '',
      pf_number: '',
      esi_number: '',
      email: '',
      phone: '',
      website: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    }
  },

  async getCompany(): Promise<CompanyProfile> {
    const response = await request(`${API_URL}/company`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    return normalizeCompany(data)
  },

  async upsertCompany(payload: CompanyProfilePayload): Promise<CompanyProfile> {
    const response = await request(`${API_URL}/company`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as unknown
    return normalizeCompany(data)
  },

  async uploadCompanyLogo(file: File): Promise<CompanyProfile> {
    const formData = new FormData()
    formData.append('logo', file)

    const response = await request(`${API_URL}/company/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    })
    const data = (await response.json()) as unknown
    return normalizeCompany(data)
  },
}

