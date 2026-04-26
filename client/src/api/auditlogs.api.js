import apiClient from './client'

export const auditLogsApi = {
  getAll:   (params) => apiClient.get('/audit-logs', { params }),
  getById:  (id)     => apiClient.get(`/audit-logs/${id}`),
}
