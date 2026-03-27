import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8010',
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — unwrap data, normalise errors
api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network error'
    console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${message}`)
    return Promise.reject(new Error(message))
  }
)

export default api
