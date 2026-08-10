import axios from 'axios'

const PRODUCTION_API_URL = 'https://malum-fintech.onrender.com/api'

// Local development uses Vite's /api proxy. In production, call Render
// directly unless VITE_API_URL explicitly provides another backend.
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PRODUCTION_API_URL : '/api')
).replace(/\/+$/, '')

const apiUrl = (path) => `${API_BASE_URL}/${path.replace(/^\/+/, '')}`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('malum_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('malum_token')
      localStorage.removeItem('malum_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (email, password) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
}

export const transactionsApi = {
  list: (params = {}) => api.get('/transactions/', { params }),
  get: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions/', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  submitReview: (id, payload) => api.post(`/transactions/${id}/submit-review`, payload),
  approve: (id, payload) => api.post(`/transactions/${id}/approve`, payload),
  reject: (id, payload) => api.post(`/transactions/${id}/reject`, payload),
  auditLog: (id) => api.get(`/transactions/${id}/audit-log`),
  stats: () => api.get('/transactions/stats/summary'),
}

export const workflowApi = {
  getQueue: (status) => api.get('/workflow/queue', { params: { status } }),
  getItem: (id) => api.get(`/workflow/queue/${id}`),
  sendToReview: (id, payload) => api.post(`/workflow/${id}/send-review`, payload),
  approve: (id, payload) => api.post(`/workflow/${id}/approve`, payload),
  reject: (id, payload) => api.post(`/workflow/${id}/reject`, payload),
  stats: () => api.get('/workflow/stats'),
}

export const reportsApi = {
  generate: (data) => api.post('/reports/generate', data),
  history: () => api.get('/reports/history'),
  downloadUrl: (id) => apiUrl(`/reports/download/${id}`),
}

export const usersApi = {
  list: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}/deactivate`),
  activity: (id) => api.get(`/users/${id}/activity`),
}

export default api
