import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/api/invoices.api'

const normalize = (result, key) =>
  Array.isArray(result) ? { [key]: result, count: result.length } : result

export const useInvoices = (params) =>
  useQuery({
    queryKey: ['invoices', params],
    queryFn:  async () => {
      const { data } = await invoicesApi.getAll(params)
      return normalize(data.data, 'invoices')
    },
  })

export const useInvoice = (id) =>
  useQuery({
    queryKey: ['invoices', id],
    queryFn:  async () => {
      const { data } = await invoicesApi.getById(id)
      return data.data.invoice
    },
    enabled: !!id,
  })

export const useApproveInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => invoicesApi.approve(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export const useMarkPaymentPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => invoicesApi.markPending(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}