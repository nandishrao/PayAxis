import apiClient from './client'

export const notificationsApi = {
  getMe:    (params) => apiClient.get('/notifications/me', { params }),
  markRead: (id)     => apiClient.patch(`/notifications/${id}/read`),
}
