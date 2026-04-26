import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications.api'

const normalize = (result, key) =>
  Array.isArray(result) ? { [key]: result, count: result.length } : result

export const useNotifications = (params) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn:  async () => {
      const { data } = await notificationsApi.getMe(params)
      return normalize(data.data, 'notifications')
    },
    refetchInterval: 30000,
  })

export const useMarkRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}