import axios from 'axios'

// Priority: env var VITE_API_URL > dev mode localhost > same-origin /api
const _envApi = import.meta.env.VITE_API_URL  // set at build time for cloud/Electron
const _isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const BASE_URL = _envApi || (_isDev ? 'http://localhost:8000/api' : '/api')
const STATIC_BASE = _envApi ? _envApi.replace('/api', '') : (_isDev ? 'http://localhost:8000' : '')

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/token', form)
  },
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: object) => api.post('/auth/register', data),
  updateUser: (id: number, data: object) => api.put(`/auth/users/${id}`, data),
}

// ─── EQUIPMENT ───────────────────────────────────────────────────────────────
export const equipmentApi = {
  list: (params?: object) => api.get('/equipment/', { params }),
  get: (id: number) => api.get(`/equipment/${id}`),
  create: (data: object) => api.post('/equipment/', data),
  update: (id: number, data: object) => api.put(`/equipment/${id}`, data),
  delete: (id: number) => api.delete(`/equipment/${id}`),
  getQR: (id: number) => `${STATIC_BASE}/api/equipment/${id}/qr`,
  getPhotoUrl: (imageUrl: string) => imageUrl ? `${STATIC_BASE}${imageUrl}` : null,
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/equipment/${id}/photo`, form)
  },
  getToolsNeeded: (id: number) => api.get(`/equipment/${id}/tools-needed`),
  listCategories: () => api.get('/equipment/categories/'),
  createCategory: (data: object) => api.post('/equipment/categories/', data),
}

// ─── MAINTENANCE PLANS ───────────────────────────────────────────────────────
export const plansApi = {
  list: (params?: object) => api.get('/maintenance-plans/', { params }),
  get: (id: number) => api.get(`/maintenance-plans/${id}`),
  create: (data: object) => api.post('/maintenance-plans/', data),
  update: (id: number, data: object) => api.put(`/maintenance-plans/${id}`, data),
  delete: (id: number) => api.delete(`/maintenance-plans/${id}`),
  upcoming: (days?: number) => api.get('/maintenance-plans/schedule/upcoming', { params: { days } }),
}

// ─── WORK ORDERS ─────────────────────────────────────────────────────────────
export const workOrdersApi = {
  list: (params?: object) => api.get('/work-orders/', { params }),
  get: (id: number) => api.get(`/work-orders/${id}`),
  create: (data: object) => api.post('/work-orders/', data),
  update: (id: number, data: object) => api.put(`/work-orders/${id}`, data),
  delete: (id: number) => api.delete(`/work-orders/${id}`),
  start: (id: number) => api.post(`/work-orders/${id}/start`),
  complete: (id: number, data: object) => api.post(`/work-orders/${id}/complete`, data),
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────
export const inventoryApi = {
  listTools: (params?: object) => api.get('/inventory/tools', { params }),
  createTool: (data: object) => api.post('/inventory/tools', data),
  updateTool: (id: number, data: object) => api.put(`/inventory/tools/${id}`, data),
  deleteTool: (id: number) => api.delete(`/inventory/tools/${id}`),

  listConsumables: (params?: object) => api.get('/inventory/consumables', { params }),
  createConsumable: (data: object) => api.post('/inventory/consumables', data),
  updateConsumable: (id: number, data: object) => api.put(`/inventory/consumables/${id}`, data),
  restock: (id: number, quantity: number) =>
    api.post(`/inventory/consumables/${id}/restock`, null, { params: { quantity } }),

  listSpareParts: (params?: object) => api.get('/inventory/spare-parts', { params }),
  createSparePart: (data: object) => api.post('/inventory/spare-parts', data),
  updateSparePart: (id: number, data: object) => api.put(`/inventory/spare-parts/${id}`, data),
  deleteSparePart: (id: number) => api.delete(`/inventory/spare-parts/${id}`),

  summary: () => api.get('/inventory/summary'),
}

// ─── LIFECYCLE ───────────────────────────────────────────────────────────────
export const lifecycleApi = {
  getHistory: (equipmentId: number) => api.get(`/lifecycle/${equipmentId}`),
  getSummary: (equipmentId: number) => api.get(`/lifecycle/${equipmentId}/summary`),
}

// ─── ALERTS ──────────────────────────────────────────────────────────────────
export const alertsApi = {
  list: (params?: object) => api.get('/alerts/', { params }),
  count: () => api.get('/alerts/count'),
  acknowledge: (id: number) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id: number) => api.post(`/alerts/${id}/resolve`),
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  costByEquipment: () => api.get('/dashboard/cost-by-equipment'),
  woByMonth: (year?: number) => api.get('/dashboard/wo-by-month', { params: { year } }),
  equipmentByStatus: () => api.get('/dashboard/equipment-by-status'),
  equipmentByCriticality: () => api.get('/dashboard/equipment-by-criticality'),
  upcomingMaintenance: (days?: number) => api.get('/dashboard/upcoming-maintenance', { params: { days } }),
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
const downloadBlob = async (url: string, filename: string) => {
  const res = await api.get(url, { responseType: 'blob' })
  const href = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

export const reportsApi = {
  equipment: () => downloadBlob('/reports/equipment', `equipos_${new Date().toISOString().slice(0,10)}.xlsx`),
  workOrders: () => downloadBlob('/reports/work-orders', `ordenes_trabajo_${new Date().toISOString().slice(0,10)}.xlsx`),
  lifecycle: (equipmentId: number) => downloadBlob(`/reports/lifecycle/${equipmentId}`, `hoja_vida_${equipmentId}_${new Date().toISOString().slice(0,10)}.xlsx`),
}
