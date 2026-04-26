import { create } from 'zustand'

const ROLE_PORTALS = {
  PLATFORM_ADMIN:    '/umbrella/dashboard',
  AGENCY_ADMIN:      '/agency/dashboard',
  AGENCY_CONSULTANT: '/agency/dashboard',
  UMBRELLA_ADMIN:    '/umbrella/dashboard',
  PAYROLL_OPERATOR:  '/umbrella/dashboard',
  CONTRACTOR:        '/contractor/dashboard',
}

export const useAuthStore = create((set, get) => ({
  user:      null,
  token:     null,

  getRole: () => {
    const { user } = get()
    if (!user?.memberships?.length) return null
    return user.memberships[0].role
  },

  getPortalPath: () => {
    const role = get().getRole()
    return role ? (ROLE_PORTALS[role] ?? '/login') : '/login'
  },

  // Called on login — sets both user and token atomically
  setAuth: (user, token) => set({ user, token }),

  // Called after /me fetch — replaces user object with full profile
  setUser: (user) => set((state) => ({ ...state, user: { ...user } })),

  logout: () => set({ user: null, token: null }),
}))