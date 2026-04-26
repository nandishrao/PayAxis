import apiClient from './client'

export const complianceApi = {
  submitRti: (payrollId) => apiClient.post(`/compliance/submit/${payrollId}`),
  getRti:    (id)        => apiClient.get(`/compliance/rti/${id}`),
}
