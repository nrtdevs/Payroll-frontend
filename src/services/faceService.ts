import { API_URL } from '../config/env'
import { handleUnauthorizedResponse, SESSION_TIMEOUT_MESSAGE } from './authGuard'

type FaceEnrollResponse = {
  detail?: string
  message?: string
}

const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    throw new Error('Auth token not found. Please login again.')
  }
  return token
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { detail?: string; message?: string }
    return data.detail || data.message || `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

export const faceService = {
  async enrollFace(image: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', image)

    const response = await fetch(`${API_URL}/face/enroll`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    })

    if (handleUnauthorizedResponse(response)) {
      throw new Error(SESSION_TIMEOUT_MESSAGE)
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    try {
      const data = (await response.json()) as FaceEnrollResponse
      return data.detail || data.message || 'Face enrolled successfully.'
    } catch {
      return 'Face enrolled successfully.'
    }
  },
}
