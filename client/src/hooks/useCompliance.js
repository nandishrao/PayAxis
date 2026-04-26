import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complianceApi } from '@/api/compliance.api'
 
export const useRtiSubmission = (id) =>
  useQuery({
    queryKey: ['rti', id],
    queryFn:  async () => {
      const { data } = await complianceApi.getRti(id)
      return data.data.submission
    },
    enabled: !!id,
  })
 
export const useSubmitRti = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payrollId) => complianceApi.submitRti(payrollId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['invoices'],  refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['rti'],       refetchType: 'all' })
      qc.refetchQueries({ queryKey: ['invoices'] })
    },
  })
}
 