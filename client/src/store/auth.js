import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin, getUserById } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggingIn: false,
      login: async (email, password) => {
        set({ isLoggingIn: true })
        try {
          const session = await apiLogin(email, password)
          set({ user: session.user, token: session.token, isLoggingIn: false })
          return session.user
        } catch (error) {
          set({ isLoggingIn: false })
          throw error
        }
      },
      logout: () => {
        try { localStorage.removeItem('rwandascore_tokens') } catch { /* storage may be unavailable */ }
        set({ user: null, token: null })
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
          if (error?.status === 401) {
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
