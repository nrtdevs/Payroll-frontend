import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type AttendanceCheckInPayload = {
  file: File
  latitude: string
  longitude: string
  ip_address: string
}

export type AttendanceRecord = {
  id: number
  user_id: number | null
  branch_id: number | null
  attendance_date: string | null
  status: string | null
  check_in: string | null
  check_out: string | null
  latitude: string | null
  longitude: string | null
  ip_address: string | null
  device_info: string | null
  face_confidence: number | null
  total_minutes: number | null
  created_at: string | null
  updated_at: string | null
}

type AttendanceListResponse = {
  items?: unknown[]
  page?: number
  size?: number
  total?: number
  total_pages?: number
}

type AttendanceActionResponse = {
  detail?: string
  message?: string
}

export type AttendanceListFilters = {
  start_date?: string
  end_date?: string
  user_id?: number | null
  branch_id?: number | null
  status?: string
}

type AttendanceExportFormat = 'pdf' | 'excel'

export type AttendancePaginatedResponse = {
  items: AttendanceRecord[]
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

const getFilenameFromDisposition = (contentDisposition: string | null, fallback: string): string => {
  if (!contentDisposition) return fallback

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      return utf8Match[1].trim()
    }
  }

  const simpleMatch = contentDisposition.match(/filename="?([^\";]+)"?/i)
  if (simpleMatch?.[1]) return simpleMatch[1].trim()
  return fallback
}

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  const text = String(value)
  return text === '' ? null : text
}

const normalizeAttendanceRecord = (value: unknown): AttendanceRecord | null => {
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
    user_id: toNumberOrNull(obj.user_id),
    branch_id: toNumberOrNull(obj.branch_id),
    attendance_date: toStringOrNull(obj.attendance_date),
    status: toStringOrNull(obj.status),
    check_in: toStringOrNull(obj.check_in ?? obj.check_in_time),
    check_out: toStringOrNull(obj.check_out ?? obj.check_out_time),
    latitude: toStringOrNull(obj.latitude),
    longitude: toStringOrNull(obj.longitude),
    ip_address: toStringOrNull(obj.ip_address),
    device_info: toStringOrNull(obj.device_info),
    face_confidence: toNumberOrNull(obj.face_confidence),
    total_minutes: toNumberOrNull(obj.total_minutes),
    created_at: toStringOrNull(obj.created_at),
    updated_at: toStringOrNull(obj.updated_at),
  }
}

const normalizeAttendanceList = (value: unknown): AttendanceRecord[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeAttendanceRecord).filter((item): item is AttendanceRecord => item !== null)
}

const buildAttendanceQuery = (filters: AttendanceListFilters = {}): URLSearchParams => {
  const query = new URLSearchParams()
  if (filters.start_date?.trim()) query.set('start_date', filters.start_date.trim())
  if (filters.end_date?.trim()) query.set('end_date', filters.end_date.trim())
  if (filters.user_id !== null && filters.user_id !== undefined) query.set('user_id', String(filters.user_id))
  if (filters.branch_id !== null && filters.branch_id !== undefined) query.set('branch_id', String(filters.branch_id))
  if (filters.status?.trim()) query.set('status', filters.status.trim().toUpperCase())
  return query
}

const downloadAttendanceExport = async (format: AttendanceExportFormat, filters: AttendanceListFilters = {}): Promise<string> => {
  const query = buildAttendanceQuery(filters)
  const response = await fetch(`${API_URL}/attendance/export/${format}?${query.toString()}`, {
    method: 'GET',
    headers: authHeaders(false),
  })

  if (handleUnauthorizedResponse(response)) {
    throw new Error(SESSION_TIMEOUT_MESSAGE)
  }
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const blob = await response.blob()
  const fallbackFileName = `attendance.${format === 'pdf' ? 'pdf' : 'xlsx'}`
  const filename = getFilenameFromDisposition(response.headers.get('Content-Disposition'), fallbackFileName)
  const objectUrl = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
  return filename
}

export const attendanceService = {
  async checkIn(payload: AttendanceCheckInPayload): Promise<string> {
    const formData = new FormData()
    formData.append('file', payload.file)
    // Some backend builds expect `image` instead of `file`.
    formData.append('image', payload.file)
    formData.append('latitude', payload.latitude)
    formData.append('longitude', payload.longitude)
    formData.append('ip_address', payload.ip_address)

    const response = await fetch(`${API_URL}/attendance/check-in`, {
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

    try {
      const data = (await response.json()) as AttendanceActionResponse
      return data.detail || data.message || 'Check-in successful.'
    } catch {
      return 'Check-in successful.'
    }
  },

  async checkOut(): Promise<string> {
    const response = await fetch(`${API_URL}/attendance/check-out`, {
      method: 'POST',
      headers: authHeaders(true),
      body: '{}',
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    try {
      const data = (await response.json()) as AttendanceActionResponse
      return data.detail || data.message || 'Check-out successful.'
    } catch {
      return 'Check-out successful.'
    }
  },

  async getAttendanceList(page: number, size: number, filters: AttendanceListFilters = {}): Promise<AttendancePaginatedResponse> {
    const query = buildAttendanceQuery(filters)
    query.set('page', String(page))
    query.set('size', String(size))

    const response = await fetch(`${API_URL}/attendance?${query.toString()}`, {
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
    if (Array.isArray(data)) {
      const items = normalizeAttendanceList(data)
      return {
        items,
        page,
        size,
        total: items.length,
        total_pages: 1,
      }
    }
    if (!data || typeof data !== 'object') {
      return {
        items: [],
        page,
        size,
        total: 0,
        total_pages: 0,
      }
    }

    const obj = data as AttendanceListResponse
    const items = normalizeAttendanceList(obj.items ?? [])
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

  async exportPdf(filters: AttendanceListFilters = {}): Promise<string> {
    return downloadAttendanceExport('pdf', filters)
  },

  async exportExcel(filters: AttendanceListFilters = {}): Promise<string> {
    return downloadAttendanceExport('excel', filters)
  },
}
