import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timesheetsApi } from '@/api/timesheet.api'

const normalize = (result, key) =>
  Array.isArray(result) ? { [key]: result, count: result.length } : result

export const useTimesheets = (params) =>
  useQuery({
    queryKey: ['timesheets', params],
    queryFn:  async () => {
      const { data } = await timesheetsApi.getAll(params)
      return normalize(data.data, 'timesheets')
    },
  })

export const useTimesheet = (id) =>
  useQuery({
    queryKey: ['timesheets', id],
    queryFn:  async () => {
      const { data } = await timesheetsApi.getById(id)
      return data.data.timesheet
    },
    enabled: !!id,
  })

export const useSubmitTimesheet = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => timesheetsApi.submit(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  })
}

export const useApproveTimesheet = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => timesheetsApi.approve(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  })
}

export const useRejectTimesheet = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rejectionReason }) => timesheetsApi.reject(id, { rejectionReason }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  })
}