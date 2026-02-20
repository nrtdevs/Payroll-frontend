import { API_URL } from '../config/env'

type LoginPayload = {
  username: string
  password: string
}

type LoginResult = {
  token: string
  userName: string
}

type MaybeLoginResponse = {
  access_token?: string
  token?: string
  user?: {
    username?: string
    name?: string
    email?: string
  }
  username?: string
  name?: string
}

type LogoutResponse = {
  detail?: string
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { detail?: string; message?: string }
    return data.detail || data.message || `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Invalid username or password.')
    }

    const data = (await response.json()) as MaybeLoginResponse

    const token = data.access_token ?? data.token
    if (!token) {
      throw new Error('Login success but token is missing in API response.')
    }

    const userName =
      data.user?.username ??
      data.user?.name ??
      data.user?.email ??
      data.username ??
      data.name ??
      payload.username

    return { token, userName }
  },

  async logout(): Promise<string> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return 'Logout successful.'
    }

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    let response = await fetch(`${API_URL}/auth/logout`, requestOptions)

    // Some backends expose logout as GET.
    if (response.status === 405) {
      response = await fetch(`${API_URL}/auth/logout`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const data = (await response.json()) as LogoutResponse
    return data.detail || 'Logout successful.'
  },
}
