export type AuthUser = {
  id?: number
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
  bank_account?: AuthUserBankAccount | null
  educations?: AuthUserEducation[] | null
  previous_companies?: AuthUserPreviousCompany[] | null
  leave_policies?: AuthUserLeavePolicy[] | null
  created_at?: string | null
}

export type AuthUserBankAccount = {
  account_holder_name?: string | null
  account_number?: string | null
  ifsc_code?: string | null
  bank_name?: string | null
}

export type AuthUserEducation = {
  id: number
  degree?: string | null
  institution?: string | null
  year_of_passing?: number | null
  percentage?: string | number | null
}

export type AuthUserPreviousCompany = {
  id: number
  company_name?: string | null
  designation?: string | null
  start_date?: string | null
  end_date?: string | null
}

export type AuthUserLeavePolicy = {
  leave_master_id: number
  leave_type_id: number
  leave_type_name: string
  proof_required: boolean
  total_leave_days: number
}

export type RolePermissionItem = {
  id: number
  name: string
  group: string
}

export type RolePermissionsData = {
  roleId: number
  roleName: string
  permissions: RolePermissionItem[]
  page: number
  size: number
  total: number
  totalPages: number
}

export type AuthState = {
  token: string | null
  user: AuthUser | null
  rolePermissions: RolePermissionsData | null
}
