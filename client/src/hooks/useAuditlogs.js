import { useQuery } from '@tanstack/react-query'
import { auditLogsApi } from '@/api/auditlogs.api'

const normalize = (result, key) =>
  Array.isArray(result) ? { [key]: result, count: result.length } : result

export const useAuditLogs = (params) =>
  useQuery({
    queryKey: ['audit-logs', params],
    queryFn:  async () => {
      const { data } = await auditLogsApi.getAll(params)
      return normalize(data.data, 'logs')
    },
  })