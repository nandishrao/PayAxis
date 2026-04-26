import apiClient from './client'

export const exceptionsApi = {
  getAll:   (params) => apiClient.get('/exceptions', { params }),
  getById:  (id)     => apiClient.get(`/exceptions/${id}`),
  resolve:  (id, data) => apiClient.patch(`/exceptions/${id}/resolve`, data),
  assign:   (id, data) => apiClient.patch(`/exceptions/${id}/assign`, data),
}