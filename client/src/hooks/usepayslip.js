import { useQuery } from '@tanstack/react-query'
import { payrollApi } from '@/api/payroll.api'

const normalize = (result, key) =>
  Array.isArray(result) ? { [key]: result, count: result.length } : result

export const useMyPayslips = () =>
  useQuery({
    queryKey: ['payslips', 'me'],
    queryFn:  async () => {
      const { data } = await payrollApi.getMyPayslips()
      return normalize(data.data, 'payslips')
    },
  })

export const usePayslip = (id) =>
  useQuery({
    queryKey: ['payslips', id],
    queryFn:  async () => {
      const { data } = await payrollApi.getPayslip(id)
      return data.data.payslip
    },
    enabled: !!id,
  })