import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organisationsApi } from '@/api/organisation.api'

export const useOrganisation = (id) =>
  useQuery({
    queryKey: ['organisations', id],
    queryFn:  async () => {
      const { data } = await organisationsApi.getById(id)
      return data.data.organisation
    },
    enabled: !!id,
  })

export const useAddMember = (orgId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => organisationsApi.addMember(orgId, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['organisations', orgId] }),
  })
}

export const useLinkContractor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => organisationsApi.linkContractor(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['organisations'] }),
  })
}