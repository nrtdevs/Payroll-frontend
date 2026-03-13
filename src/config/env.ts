const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL
const rawApiUrl = import.meta.env.VITE_API_URL

export const API_URL = (rawApiBaseUrl || rawApiUrl || 'http://127.0.0.1:8000').replace(/\/+$/, '')
