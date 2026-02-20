import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './authContext'
import type { AuthState, AuthUser, RolePermissionsData } from './authTypes'

const USER_STORAGE_KEY = 'auth_user_details'
const ROLE_PERMISSIONS_STORAGE_KEY = 'auth_role_permissions'

const parseJsonSafely = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const getInitialAuthState = (): AuthState => {
  const token = localStorage.getItem('auth_token')
  const user = parseJsonSafely<AuthUser>(localStorage.getItem(USER_STORAGE_KEY))
  const rolePermissions = parseJsonSafely<RolePermissionsData>(localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY))
  return {
    token,
    user,
    rolePermissions,
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(getInitialAuthState)

  const setAuthData = (token: string, user: AuthUser | null, rolePermissions: RolePermissionsData | null) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', user?.name || user?.username || user?.email || '')
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(ROLE_PERMISSIONS_STORAGE_KEY, JSON.stringify(rolePermissions))
    setAuthState({
      token,
      user,
      rolePermissions,
    })
  }

  const clearAuthData = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(ROLE_PERMISSIONS_STORAGE_KEY)
    setAuthState({
      token: null,
      user: null,
      rolePermissions: null,
    })
  }

  const contextValue = useMemo(
    () => ({
      authState,
      setAuthData,
      clearAuthData,
      isAuthenticated: Boolean(authState.token),
    }),
    [authState],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export default AuthProvider
