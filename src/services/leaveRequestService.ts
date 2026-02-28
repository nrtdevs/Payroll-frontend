import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type ApplyLeaveRequestPayload = {
  leave_type_id: number
  start_date: string
  end_date: string
  reason: string
  proof_file_path?: string | null
}

export type RejectLeaveRequestPayload = {
  rejection_reason: string
}

export type LeaveRequest = {
  id: number
  user_id?: number | null
  user_name?: string | null
  leave_type_id?: number | null
  leave_type_name?: string | null
  start_date?: string | null
  end_date?: string | null
  reason?: string | null
  proof_file_path?: string | null
  status?: string | null
  rejection_reason?: string | null
  created_at?: string | null
  updated_at?: string | null
}

const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token')
  if (!token) throw new Error('Auth token not found. Please login again.')
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

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeLeaveRequest = (value: unknown): LeaveRequest | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) return null

  return {
    id,
    user_id: toNumberOrNull(obj.user_id),
    user_name: (obj.user_name as string | null | undefined) ?? null,
    leave_type_id: toNumberOrNull(obj.leave_type_id),
    leave_type_name: (obj.leave_type_name as string | null | undefined) ?? null,
    start_date: (obj.start_date as string | null | undefined) ?? null,
    end_date: (obj.end_date as string | null | undefined) ?? null,
    reason: (obj.reason as string | null | undefined) ?? null,
    proof_file_path: (obj.proof_file_path as string | null | undefined) ?? null,
    status: (obj.status as string | null | undefined) ?? null,
    rejection_reason: (obj.rejection_reason as string | null | undefined) ?? null,
    created_at: (obj.created_at as string | null | undefined) ?? null,
    updated_at: (obj.updated_at as string | null | undefined) ?? null,
  }
}

const normalizeLeaveRequestList = (value: unknown): LeaveRequest[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeLeaveRequest).filter((item): item is LeaveRequest => item !== null)
}

export const leaveRequestService = {
  async applyLeave(payload: ApplyLeaveRequestPayload): Promise<LeaveRequest | null> {
    const response = await fetch(`${API_URL}/leave-requests`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeLeaveRequest((await response.json()) as unknown)
  },

  async getMyRequests(): Promise<LeaveRequest[]> {
    const response = await fetch(`${API_URL}/leave-requests/my`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeLeaveRequestList((await response.json()) as unknown)
  },

  async getTeamPendingRequests(): Promise<LeaveRequest[]> {
    const response = await fetch(`${API_URL}/leave-requests/team`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
    return normalizeLeaveRequestList((await response.json()) as unknown)
  },

  async approveRequest(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/leave-requests/${id}/approve`, {
      method: 'PUT',
      headers: authHeaders(false),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
  },

  async rejectRequest(id: number, payload: RejectLeaveRequestPayload): Promise<void> {
    const response = await fetch(`${API_URL}/leave-requests/${id}/reject`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
  },
}
