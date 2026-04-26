import apiClient from './client'

export const authApi = {
  register: (data)  => apiClient.post('/auth/register', data),
  login:    (data)  => apiClient.post('/auth/login', data),
  me:       ()      => apiClient.get('/auth/me'),
}