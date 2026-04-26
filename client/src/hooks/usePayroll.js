import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollApi } from '@/api/payroll.api'



export const usePayroll = (id) =>
  useQuery({
    queryKey: ['payroll', id],
    queryFn:  async () => {
      const { data } = await payrollApi.getById(id)
      return data.data.payroll
    },
    enabled: !!id,
  })


export const useRunPayroll = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, options }) => payrollApi.run(invoiceId, options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['payroll'] })
      qc.refetchQueries({ queryKey: ['invoices'] })
    },
  })
}
    