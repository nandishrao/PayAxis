import apiClient from './client'

export const organisationsApi = {
  create:         (data)   => apiClient.post('/organisations', data),
  getById:        (id)     => apiClient.get(`/organisations/${id}`),
  addMember:      (id, data) => apiClient.post(`/organisations/${id}/members`, data),
  linkContractor: (data)   => apiClient.post('/organisations/contractors/link', data),
}