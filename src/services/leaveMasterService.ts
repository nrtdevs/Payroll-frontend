import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

export type CreateLeaveMasterPayload = {
  employment_type_id: number
  leaves: Array<{
    leave_type_id: number
    total_leave_days: number
  }>
}

export type UpdateLeaveMasterPayload = {
  employment_type_id: number
  leaves: Array<{
    leave_type_id: number
    total_leave_days: number
  }>
}

export type LeaveMaster = {
  id: number
  employment_type_id: number
  employment_type_name: string
  leave_type_id: number
  leave_type_name: string
  proof_required: boolean
  total_leave_days: number
  created_at?: string
  updated_at?: string
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

const toNumberOrNaN = (value: unknown): number => {
  return typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
}

const normalizeLeaveMaster = (value: unknown): LeaveMaster | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>

  const id = toNumberOrNaN(obj.id)
  const employmentTypeId = toNumberOrNaN(obj.employment_type_id)
  const leaveTypeId = toNumberOrNaN(obj.leave_type_id)
  const totalLeaveDays = toNumberOrNaN(obj.total_leave_days)

  if (!Number.isFinite(id) || !Number.isFinite(employmentTypeId) || !Number.isFinite(leaveTypeId) || !Number.isFinite(totalLeaveDays)) {
    return null
  }

  return {
    id,
    employment_type_id: employmentTypeId,
    employment_type_name: typeof obj.employment_type_name === 'string' ? obj.employment_type_name : '',
    leave_type_id: leaveTypeId,
    leave_type_name: typeof obj.leave_type_name === 'string' ? obj.leave_type_name : '',
    proof_required: Boolean(obj.proof_required),
    total_leave_days: totalLeaveDays,
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  }
}

const normalizeLeaveMasterList = (value: unknown): LeaveMaster[] => {
  const normalizeFromGroupedRows = (rows: unknown[]): LeaveMaster[] => {
    const flattened: LeaveMaster[] = []

    rows.forEach((row) => {
      if (!row || typeof row !== 'object') return
      const group = row as Record<string, unknown>
      const employmentTypeId = toNumberOrNaN(group.employment_type_id)
      const employmentTypeName = typeof group.employment_type_name === 'string' ? group.employment_type_name : ''
      const leaves = Array.isArray(group.leaves) ? group.leaves : []

      if (!Number.isFinite(employmentTypeId)) return

      leaves.forEach((leave) => {
        if (!leave || typeof leave !== 'object') return
        const leaveObj = leave as Record<string, unknown>
        const id = toNumberOrNaN(leaveObj.id)
        const leaveTypeId = toNumberOrNaN(leaveObj.leave_type_id)
        const totalLeaveDays = toNumberOrNaN(leaveObj.total_leave_days)

        if (!Number.isFinite(id) || !Number.isFinite(leaveTypeId) || !Number.isFinite(totalLeaveDays)) return

        flattened.push({
          id,
          employment_type_id: employmentTypeId,
          employment_type_name: employmentTypeName,
          leave_type_id: leaveTypeId,
          leave_type_name: typeof leaveObj.leave_type_name === 'string' ? leaveObj.leave_type_name : '',
          proof_required: Boolean(leaveObj.proof_required),
          total_leave_days: totalLeaveDays,
          created_at: undefined,
          updated_at: undefined,
        })
      })
    })

    return flattened
  }

  if (Array.isArray(value)) {
    const direct = value.map(normalizeLeaveMaster).filter((item): item is LeaveMaster => item !== null)
    if (direct.length > 0) return direct
    return normalizeFromGroupedRows(value)
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      const direct = obj.items.map(normalizeLeaveMaster).filter((item): item is LeaveMaster => item !== null)
      if (direct.length > 0) return direct
      return normalizeFromGroupedRows(obj.items)
    }
    if (Array.isArray(obj.data)) {
      const direct = obj.data.map(normalizeLeaveMaster).filter((item): item is LeaveMaster => item !== null)
      if (direct.length > 0) return direct
      return normalizeFromGroupedRows(obj.data)
    }
  }

  return []
}

export const leaveMasterService = {
  async createLeaveMaster(payload: CreateLeaveMasterPayload): Promise<LeaveMaster | null> {
    const response = await fetch(`${API_URL}/leave-masters`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))

    const data = (await response.json()) as unknown
    return normalizeLeaveMaster(data)
  },

  async getLeaveMasters(): Promise<LeaveMaster[]> {
    const response = await fetch(`${API_URL}/leave-masters`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))

    const data = (await response.json()) as unknown
    return normalizeLeaveMasterList(data)
  },

  async getLeaveMasterById(id: number): Promise<LeaveMaster> {
    const response = await fetch(`${API_URL}/leave-masters/${id}`, {
      method: 'GET',
      headers: authHeaders(false),
    })

    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))

    const data = (await response.json()) as unknown
    const leaveMaster = normalizeLeaveMaster(data)
    if (!leaveMaster) throw new Error('Invalid leave master response.')
    return leaveMaster
  },

  async updateLeaveMaster(payload: UpdateLeaveMasterPayload): Promise<LeaveMaster | null> {
    const response = await fetch(`${API_URL}/leave-masters`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })

    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))

    const data = (await response.json()) as unknown
    return normalizeLeaveMaster(data)
  },

  async deleteLeaveMaster(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/leave-masters/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
    })

    if (handleUnauthorizedResponse(response)) throw new Error(SESSION_TIMEOUT_MESSAGE)
    if (!response.ok) throw new Error(await parseErrorMessage(response))
  },
}
