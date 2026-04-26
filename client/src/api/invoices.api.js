import apiClient from './client'

export const invoicesApi = {
  getAll:          (params) => apiClient.get('/invoices', { params }),
  getById:         (id)     => apiClient.get(`/invoices/${id}`),
  approve:         (id)     => apiClient.patch(`/invoices/${id}/approve`),
  markPending:     (id)     => apiClient.patch(`/invoices/${id}/payment-pending`),
}