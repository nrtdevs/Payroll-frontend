const rawApiUrl = import.meta.env.VITE_API_URL

export const API_URL = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : 'http://127.0.0.1:8000'
