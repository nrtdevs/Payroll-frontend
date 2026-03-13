export type SalaryComponentType = 'EARNING' | 'DEDUCTION'

export type SalaryComponent = {
  id: number
  name: string
  type: SalaryComponentType
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type SalaryComponentPayload = {
  name: string
  type: SalaryComponentType
  is_active?: boolean
}

export type SalaryStructureComponent = {
  id?: number
  component_id: number
  component_name?: string
  component_type?: SalaryComponentType
}

export type SalaryStructure = {
  id: number
  name: string
  is_active?: boolean
  components: SalaryStructureComponent[]
  created_at?: string
  updated_at?: string
}

export type SalaryStructurePayload = {
  name: string
  component_ids: number[]
  is_active?: boolean
}

export type EmployeeSalaryComponentAmount = {
  component_id: number
  component_name?: string
  component_type?: SalaryComponentType
  amount: number
}

export type EmployeeSalary = {
  id: number
  employee_id: number
  employee_name?: string
  salary_structure_id: number
  salary_structure_name?: string
  gross_salary?: number
  total_deductions?: number
  net_salary?: number
  effective_from?: string
  components?: EmployeeSalaryComponentAmount[]
  created_at?: string
  updated_at?: string
}

export type EmployeeSalaryPayload = {
  employee_id?: number
  salary_structure_id?: number
  effective_from?: string
  components: EmployeeSalaryComponentAmount[]
}

export type SalaryBreakdownItem = {
  component_id?: number
  component_name: string
  type?: SalaryComponentType
  amount: number
}

export type SalaryBreakdownResponse = {
  employee_id: number
  employee_name?: string
  gross_salary?: number
  breakdown: SalaryBreakdownItem[]
}

export type PayrollGeneratePayload = {
  employee_id: number
  year: number
  month: number
}

export type PayrollRecord = {
  id?: number
  employee_id?: number
  employee_name?: string
  month_label?: string
  year: number
  month: number
  total_days?: number
  weekend_days?: number
  holiday_days?: number
  working_days?: number
  present_days?: number
  leave_days?: number
  absent_days?: number
  per_day_salary?: number
  absent_deduction?: number
  earnings?: SalarySlipItem[]
  deductions?: SalarySlipItem[]
  gross_salary?: number
  net_salary?: number
  total_deduction?: number
  total_deductions?: number
  generated_at?: string
  status?: string
}

export type PayrollGenerateResponse = {
  message?: string
  payroll: PayrollRecord | PayrollRecord[]
}

export type SalarySlipItem = {
  component_name: string
  amount: number
}

export type SalarySlipResponse = {
  employee_id: number
  employee_name: string
  month: string
  earnings: SalarySlipItem[]
  deductions: SalarySlipItem[]
  gross_salary: number
  net_salary: number
}

export type PaginatedResponse<T> = {
  items: T[]
  page: number
  size: number
  total: number
  total_pages: number
}
