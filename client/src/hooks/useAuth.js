import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'

export const useLogin = () => {
  const { setAuth, getPortalPath } = useAuthStore()
  const navigate = useNavigate()
  const qc       = useQueryClient()

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: async ({ data }) => {
      // Set token immediately so the /me request can use it
      setAuth(data.data.user, data.data.token)

      // Fetch full user profile including memberships + contractorLinks
      try {
        const meRes  = await authApi.me()
        const fullUser = meRes.data.data.user
        setAuth(fullUser, data.data.token)
        qc.setQueryData(['me'], fullUser)

        // Derive portal path from the fully loaded user
        const role = fullUser?.memberships?.[0]?.role
        const portals = {
          PLATFORM_ADMIN:    '/umbrella/dashboard',
          AGENCY_ADMIN:      '/agency/dashboard',
          AGENCY_CONSULTANT: '/agency/dashboard',
          UMBRELLA_ADMIN:    '/umbrella/dashboard',
          PAYROLL_OPERATOR:  '/umbrella/dashboard',
          CONTRACTOR:        '/contractor/dashboard',
        }
        navigate(portals[role] ?? '/login')
      } catch {
        navigate(getPortalPath())
      }
    },
  })
}

export const useRegister = () => {
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  return useMutation({
    mutationFn: (payload) => authApi.register(payload),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.token)
      navigate('/login')
    },
  })
}

export const useMe = () => {
  const { token, setUser } = useAuthStore()

  return useQuery({
    queryKey: ['me'],
    queryFn:  async () => {
      const { data } = await authApi.me()
      const user = data.data.user
      setUser(user)
      return user
    },
    enabled:   !!token,
    staleTime: 2 * 60 * 1000,
    retry:     false,
  })
}

export const useLogout = () => {
  const { logout }  = useAuthStore()
  const navigate    = useNavigate()
  const qc          = useQueryClient()

  return () => {
    logout()
    qc.clear()
    navigate('/login')
  }
}