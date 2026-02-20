export const SESSION_TIMEOUT_MESSAGE = 'Session timeout. Please login again.'

export const handleUnauthorizedResponse = (response: Response): boolean => {
  if (response.status !== 401 && response.status !== 403) {
    return false
  }

  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_user_details')
  localStorage.removeItem('auth_role_permissions')
  sessionStorage.setItem('auth_toast_message', SESSION_TIMEOUT_MESSAGE)

  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }

  return true
}
