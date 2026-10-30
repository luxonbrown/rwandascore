import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin, logout as apiLogout, getCurrentUser, getUserById, hasSessionTokens } from '../services/api'

let sessionHydration

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggingIn: false,
      isSessionChecked: false,
      login: async (email, password) => {
        set({ isLoggingIn: true })
        try {
          const session = await apiLogin(email, password)
          set({ user: session.user, token: session.token, isLoggingIn: false, isSessionChecked: true })
          return session.user
        } catch (error) {
          set({ isLoggingIn: false })
          throw error
        }
      },
      logout: () => {
        void apiLogout()
        set({ user: null, token: null, isSessionChecked: true })
      },
      hydrateSession: () => {
        if (sessionHydration) return sessionHydration

        const current = get().user
        if (!current?.id && !hasSessionTokens()) {
          set({ isSessionChecked: true })
          return Promise.resolve(null)
        }

        sessionHydration = (async () => {
          try {
            const fresh = current?.id ? await getUserById(current.id) : await getCurrentUser()
            if (!fresh || fresh.status !== 'Active') {
              get().logout()
              return null
            }
            set({ user: fresh, token: get().token, isSessionChecked: true })
            return fresh
          } catch (error) {
            if (error?.status === 401 || error?.code === 'ACCOUNT_DISABLED') {
              get().logout()
              return null
            }
            set({ isSessionChecked: true })
            return current
          } finally {
            sessionHydration = null
          }
        })()

        return sessionHydration
      },
      refreshUser: async () => {
        const current = get().user
        if (!current?.id) return null
        try {
          const fresh = await getUserById(current.id)
          if (!fresh || fresh.status !== 'Active') {
            get().logout()
            return null
          }
          set({ user: fresh })
          return fresh
        } catch (error) {
          if (error?.status === 401 || error?.code === 'ACCOUNT_DISABLED') {
            get().logout()
            return null
          }
          return current
        }
      },
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'rwandascore_auth_v1',
      partialize: ({ user, token }) => ({ user, token }),
    },
  ),
)

if (typeof window !== 'undefined') {
  window.addEventListener('rwandascore:auth-expired', () => useAuthStore.getState().logout())
}
