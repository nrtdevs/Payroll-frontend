import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'
import type {
  EmployeeSalary,
  EmployeeSalaryComponentAmount,
  EmployeeSalaryPayload,
  PaginatedResponse,
  PayrollGeneratePayload,
  PayrollGenerateResponse,
  PayrollRecord,
  SalaryBreakdownItem,
  SalaryBreakdownResponse,
  SalaryComponent,
  SalaryComponentPayload,
  SalaryComponentType,
  SalarySlipResponse,
  SalaryStructure,
  SalaryStructureComponent,
  SalaryStructurePayload,
} from '../types/salaryTypes'

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

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.trim().toLowerCase())
  return fallback
}

const normalizeComponentType = (value: unknown): SalaryComponentType => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return normalized === 'DEDUCTION' ? 'DEDUCTION' : 'EARNING'
}

const normalizeSalaryComponent = (value: unknown): SalaryComponent | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) return null

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    type: normalizeComponentType(obj.type),
    is_active: obj.is_active === undefined ? undefined : toBoolean(obj.is_active, true),
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  }
}

const normalizeSalaryComponentList = (value: unknown): SalaryComponent[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeSalaryComponent).filter((item): item is SalaryComponent => item !== null)
}

const normalizeSalaryStructureComponent = (value: unknown): SalaryStructureComponent | null => {
  if (typeof value === 'number') {
    return { component_id: value }
  }
  if (!value || typeof value !== 'object') return null

  const obj = value as Record<string, unknown>
  const componentId = toNumberOrNull(obj.component_id ?? obj.salary_component_id ?? obj.componentId ?? obj.id)
  if (componentId === null) return null

  return {
    id: toNumberOrNull(obj.id) ?? undefined,
    component_id: componentId,
    component_name:
      typeof obj.component_name === 'string'
        ? obj.component_name
        : typeof obj.name === 'string'
          ? obj.name
          : undefined,
    component_type: obj.component_type ? normalizeComponentType(obj.component_type) : obj.type ? normalizeComponentType(obj.type) : undefined,
  }
}

const normalizeSalaryStructureComponents = (value: unknown): SalaryStructureComponent[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeSalaryStructureComponent).filter((item): item is SalaryStructureComponent => item !== null)
  }
  return []
}

const normalizeSalaryStructure = (value: unknown): SalaryStructure | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  if (id === null) return null

  const componentIds = Array.isArray(obj.component_ids)
    ? (obj.component_ids as unknown[]).map((item) => toNumberOrNull(item)).filter((item): item is number => item !== null)
    : []

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : `Structure #${id}`,
    is_active: obj.is_active === undefined ? undefined : toBoolean(obj.is_active, true),
    components:
      componentIds.length > 0
        ? componentIds.map((componentId) => ({ component_id: componentId }))
        : normalizeSalaryStructureComponents(obj.components),
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  }
}

const normalizeSalaryStructureList = (value: unknown): SalaryStructure[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeSalaryStructure).filter((item): item is SalaryStructure => item !== null)
}

const normalizeEmployeeSalaryComponent = (value: unknown): EmployeeSalaryComponentAmount | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const componentId = toNumberOrNull(obj.component_id ?? obj.salary_component_id)
  const amount = toNumberOrNull(obj.salary_component_amount ?? obj.amount)
  if (componentId === null || amount === null) return null

  return {
    component_id: componentId,
    component_name:
      typeof obj.component_name === 'string'
        ? obj.component_name
        : typeof obj.name === 'string'
          ? obj.name
          : undefined,
    component_type: obj.component_type ? normalizeComponentType(obj.component_type) : obj.type ? normalizeComponentType(obj.type) : undefined,
    amount,
  }
}

const serializeEmployeeSalaryComponents = (components: EmployeeSalaryComponentAmount[]) =>
  components.map((item) => ({
    component_id: item.component_id,
    amount: item.amount,
  }))

const normalizeEmployeeSalary = (value: unknown): EmployeeSalary | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const id = toNumberOrNull(obj.id)
  const employeeId = toNumberOrNull(obj.employee_id)
  const structureId = toNumberOrNull(obj.salary_structure_id)
  if (id === null || employeeId === null || structureId === null) return null

  const components = Array.isArray(obj.components)
    ? (obj.components as unknown[])
        .map(normalizeEmployeeSalaryComponent)
        .filter((item): item is EmployeeSalaryComponentAmount => item !== null)
    : undefined

  return {
    id,
    employee_id: employeeId,
    employee_name: typeof obj.employee_name === 'string' ? obj.employee_name : undefined,
    salary_structure_id: structureId,
    salary_structure_name: typeof obj.salary_structure_name === 'string' ? obj.salary_structure_name : undefined,
    gross_salary: toNumberOrNull(obj.gross_salary) ?? toNumberOrNull(obj.monthly_gross) ?? toNumberOrNull(obj.annual_ctc) ?? undefined,
    total_deductions: toNumberOrNull(obj.total_deductions) ?? toNumberOrNull(obj.total_deduction) ?? undefined,
    net_salary: toNumberOrNull(obj.net_salary) ?? undefined,
    effective_from:
      typeof obj.effective_from === 'string'
        ? obj.effective_from
        : typeof obj.effective_date === 'string'
          ? obj.effective_date
          : undefined,
    components,
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  }
}

const normalizeEmployeeSalaryList = (value: unknown): EmployeeSalary[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeEmployeeSalary).filter((item): item is EmployeeSalary => item !== null)
}

const normalizeBreakdownItem = (value: unknown): SalaryBreakdownItem | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const amount = toNumberOrNull(obj.amount)
  if (amount === null) return null

  return {
    component_id: toNumberOrNull(obj.component_id) ?? undefined,
    component_name:
      typeof obj.component_name === 'string'
        ? obj.component_name
        : typeof obj.name === 'string'
          ? obj.name
          : 'Component',
    type: obj.type ? normalizeComponentType(obj.type) : undefined,
    amount,
  }
}

const normalizeBreakdownList = (value: unknown): SalaryBreakdownItem[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeBreakdownItem).filter((item): item is SalaryBreakdownItem => item !== null)
}

const normalizePayrollRecord = (value: unknown): PayrollRecord | null => {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const year = toNumberOrNull(obj.year)
  const month = toNumberOrNull(obj.month)
  if (year === null || month === null) return null

  return {
    id: toNumberOrNull(obj.id) ?? undefined,
    employee_id: toNumberOrNull(obj.employee_id) ?? undefined,
    employee_name: typeof obj.employee_name === 'string' ? obj.employee_name : undefined,
    year,
    month,
    gross_salary: toNumberOrNull(obj.gross_salary) ?? undefined,
    net_salary: toNumberOrNull(obj.net_salary) ?? undefined,
    total_deduction: toNumberOrNull(obj.total_deduction) ?? undefined,
    generated_at: typeof obj.generated_at === 'string' ? obj.generated_at : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
  }
}

const normalizePayrollRecordList = (value: unknown): PayrollRecord[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizePayrollRecord).filter((item): item is PayrollRecord => item !== null)
}

const normalizeSalarySlipResponse = (value: unknown): SalarySlipResponse => {
  const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  const parseSlipItems = (items: unknown): { component_name: string; amount: number }[] => {
    if (items && typeof items === 'object' && !Array.isArray(items)) {
      return Object.entries(items as Record<string, unknown>)
        .map(([component_name, amount]) => {
          const parsedAmount = toNumberOrNull(amount)
          if (parsedAmount === null) return null
          return { component_name, amount: parsedAmount }
        })
        .filter((item): item is { component_name: string; amount: number } => item !== null)
    }
    if (!Array.isArray(items)) return []

    return items
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const amount = toNumberOrNull(record.amount)
        if (amount === null) return null
        return {
          component_name:
            typeof record.component_name === 'string'
              ? record.component_name
              : typeof record.name === 'string'
                ? record.name
                : 'Component',
          amount,
        }
      })
      .filter((item): item is { component_name: string; amount: number } => item !== null)
  }

  return {
    employee_id: toNumberOrNull(obj.employee_id) ?? 0,
    employee_name: typeof obj.employee_name === 'string' ? obj.employee_name : '',
    month: typeof obj.month === 'string' ? obj.month : '',
    earnings: parseSlipItems(obj.earnings),
    deductions: parseSlipItems(obj.deductions),
    gross_salary: toNumberOrNull(obj.gross_salary) ?? 0,
    net_salary: toNumberOrNull(obj.net_salary) ?? 0,
  }
}

const normalizePaginated = <T>(raw: unknown, fallbackPage: number, fallbackSize: number, listParser: (value: unknown) => T[]): PaginatedResponse<T> => {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const items = Array.isArray(raw) ? listParser(raw) : listParser(obj.items ?? [])
  const page = toNumberOrNull(obj.page) ?? fallbackPage
  const size = toNumberOrNull(obj.size) ?? fallbackSize
  const total = toNumberOrNull(obj.total) ?? items.length
  const totalPages = toNumberOrNull(obj.total_pages) ?? Math.ceil(total / Math.max(size, 1))

  return {
    items,
    page,
    size,
    total,
    total_pages: totalPages,
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

export const salaryService = {
  async createSalaryComponent(payload: SalaryComponentPayload): Promise<SalaryComponent | null> {
    const response = await request(`${API_URL}/salary-components`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as unknown
    return normalizeSalaryComponent(data)
  },

  async getSalaryComponents(page?: number, size?: number): Promise<PaginatedResponse<SalaryComponent>> {
    const query = new URLSearchParams()
    if (page && page > 0) query.set('page', String(page))
    if (size && size > 0) query.set('size', String(size))
    const queryString = query.toString()

    const response = await request(`${API_URL}/salary-components${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    return normalizePaginated(data, page ?? 1, size ?? 10, normalizeSalaryComponentList)
  },

  async updateSalaryComponent(id: number, payload: SalaryComponentPayload): Promise<SalaryComponent | null> {
    const response = await request(`${API_URL}/salary-components/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as unknown
    return normalizeSalaryComponent(data)
  },

  async createSalaryStructure(payload: SalaryStructurePayload): Promise<SalaryStructure | null> {
    const response = await request(`${API_URL}/salary-structures`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        name: payload.name,
        components: payload.component_ids,
        ...(payload.is_active === undefined ? {} : { is_active: payload.is_active }),
      }),
    })
    const data = (await response.json()) as unknown
    return normalizeSalaryStructure(data)
  },

  async getSalaryStructures(page?: number, size?: number): Promise<PaginatedResponse<SalaryStructure>> {
    const query = new URLSearchParams()
    if (page && page > 0) query.set('page', String(page))
    if (size && size > 0) query.set('size', String(size))
    const queryString = query.toString()

    const response = await request(`${API_URL}/salary-structures${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    return normalizePaginated(data, page ?? 1, size ?? 10, normalizeSalaryStructureList)
  },

  async getSalaryStructureById(id: number): Promise<SalaryStructure> {
    const response = await request(`${API_URL}/salary-structures/${id}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    const structure = normalizeSalaryStructure(data)
    if (!structure) {
      throw new Error('Invalid salary structure response.')
    }
    return structure
  },

  async updateSalaryStructure(id: number, payload: SalaryStructurePayload): Promise<SalaryStructure | null> {
    const response = await request(`${API_URL}/salary-structures/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({
        name: payload.name,
        components: payload.component_ids,
        ...(payload.is_active === undefined ? {} : { is_active: payload.is_active }),
      }),
    })
    const data = (await response.json()) as unknown
    return normalizeSalaryStructure(data)
  },

  async createEmployeeSalary(payload: EmployeeSalaryPayload): Promise<EmployeeSalary | null> {
    const response = await request(`${API_URL}/employee-salaries`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        employee_id: payload.employee_id,
        salary_structure_id: payload.salary_structure_id,
        ...(payload.effective_from ? { effective_from: payload.effective_from } : {}),
        components: serializeEmployeeSalaryComponents(payload.components),
      }),
    })
    const data = (await response.json()) as unknown
    return normalizeEmployeeSalary(data)
  },

  async updateEmployeeSalary(id: number, payload: EmployeeSalaryPayload): Promise<EmployeeSalary | null> {
    const requestBody: Record<string, unknown> = {
      ...(payload.employee_id ? { employee_id: payload.employee_id } : {}),
      ...(payload.salary_structure_id ? { salary_structure_id: payload.salary_structure_id } : {}),
      ...(payload.effective_from ? { effective_from: payload.effective_from } : {}),
      components: serializeEmployeeSalaryComponents(payload.components),
    }

    const response = await request(`${API_URL}/employee-salaries/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(requestBody),
    })
    const data = (await response.json()) as unknown
    return normalizeEmployeeSalary(data)
  },

  async getEmployeeSalaries(page?: number, size?: number): Promise<PaginatedResponse<EmployeeSalary>> {
    const query = new URLSearchParams()
    if (page && page > 0) query.set('page', String(page))
    if (size && size > 0) query.set('size', String(size))
    const queryString = query.toString()

    const response = await request(`${API_URL}/employee-salaries${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    return normalizePaginated(data, page ?? 1, size ?? 10, normalizeEmployeeSalaryList)
  },

  async getEmployeeSalaryByEmployeeId(employeeId: number): Promise<EmployeeSalary[]> {
    const response = await request(`${API_URL}/employee-salaries/${employeeId}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    if (Array.isArray(data)) {
      return normalizeEmployeeSalaryList(data)
    }
    const single = normalizeEmployeeSalary(data)
    return single ? [single] : []
  },

  async getEmployeeSalaryBreakdown(employeeId: number): Promise<SalaryBreakdownResponse> {
    const response = await request(`${API_URL}/employee-salaries/${employeeId}/breakdown`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}

    return {
      employee_id: toNumberOrNull(obj.employee_id) ?? employeeId,
      employee_name: typeof obj.employee_name === 'string' ? obj.employee_name : undefined,
      gross_salary: toNumberOrNull(obj.gross_salary) ?? undefined,
      breakdown: normalizeBreakdownList(obj.breakdown ?? data),
    }
  },

  async generatePayroll(payload: PayrollGeneratePayload): Promise<PayrollGenerateResponse> {
    const response = await request(`${API_URL}/payroll/generate`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as unknown
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    const payrollData = obj.payroll ?? obj.items ?? data

    return {
      message: typeof obj.message === 'string' ? obj.message : undefined,
      payroll: Array.isArray(payrollData)
        ? normalizePayrollRecordList(payrollData)
        : (() => {
            const record = normalizePayrollRecord(payrollData)
            return record ? [record] : []
          })(),
    }
  },

  async getPayrollRecords(filters: { year?: number; month?: number; page?: number; size?: number }): Promise<PaginatedResponse<PayrollRecord>> {
    const query = new URLSearchParams()
    if (filters.year && filters.year > 0) query.set('year', String(filters.year))
    if (filters.month && filters.month > 0) query.set('month', String(filters.month))
    if (filters.page && filters.page > 0) query.set('page', String(filters.page))
    if (filters.size && filters.size > 0) query.set('size', String(filters.size))

    const response = await request(`${API_URL}/payroll?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    return normalizePaginated(data, filters.page ?? 1, filters.size ?? 10, normalizePayrollRecordList)
  },

  async getSalarySlip(employeeId: number, month: string): Promise<SalarySlipResponse> {
    const response = await request(`${API_URL}/salary-slip/${employeeId}?month=${encodeURIComponent(month)}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    const data = (await response.json()) as unknown
    return normalizeSalarySlipResponse(data)
  },

  async downloadSalarySlipPdf(employeeId: number, month: string): Promise<Blob> {
    const response = await request(`${API_URL}/salary-slip/${employeeId}/pdf?month=${encodeURIComponent(month)}`, {
      method: 'GET',
      headers: authHeaders(false),
    })
    return response.blob()
  },
}
