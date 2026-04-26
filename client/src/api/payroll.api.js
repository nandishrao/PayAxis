import apiClient from './client'

export const payrollApi = {
  run:          (invoiceId, data) => apiClient.post(`/payroll/run/${invoiceId}`, data),
  getById:      (id)              => apiClient.get(`/payroll/${id}`),
  getMyPayslips: ()               => apiClient.get('/payroll/payslips/me'),
  getPayslip:   (id)              => apiClient.get(`/payroll/payslips/${id}`),
}