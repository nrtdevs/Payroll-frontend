import { createContext } from 'react'
import type { AuthState, AuthUser, RolePermissionsData } from './authTypes'

export type AuthContextValue = {
  authState: AuthState
  setAuthData: (token: string, user: AuthUser | null, rolePermissions: RolePermissionsData | null) => void
  clearAuthData: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
