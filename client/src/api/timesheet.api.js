import apiClient from './client'

export const timesheetsApi = {
  getAll:   (params) => apiClient.get('/timesheets', { params }),
  getById:  (id)     => apiClient.get(`/timesheets/${id}`),
  submit:   (data)   => apiClient.post('/timesheets', data),
  approve:  (id)     => apiClient.patch(`/timesheets/${id}/approve`),
  reject:   (id, data) => apiClient.patch(`/timesheets/${id}/reject`, data),
}