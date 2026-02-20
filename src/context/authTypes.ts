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
