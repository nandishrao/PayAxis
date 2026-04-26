import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exceptionsApi } from '@/api/exceptions.api'

const normalize = (result, key) =>
  Array.isArray(result) ? { [key]: result, count: result.length } : result

export const useExceptions = (params) =>
  useQuery({
    queryKey: ['exceptions', params],
    queryFn:  async () => {
      const { data } = await exceptionsApi.getAll(params)
      return normalize(data.data, 'exceptions')
    },
  })

export const useException = (id) =>
  useQuery({
    queryKey: ['exceptions', id],
    queryFn:  async () => {
      const { data } = await exceptionsApi.getById(id)
      return data.data.exception
    },
    enabled: !!id,
  })

export const useResolveException = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => exceptionsApi.resolve(id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['exceptions'] }),
  })
}

export const useAssignException = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assignedToId }) => exceptionsApi.assign(id, { assignedToId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['exceptions'] }),
  })
}