import { create } from 'zustand'
import { getMe, login, logout } from '../api/auth'
import type { AuthRequest } from '../schemas/auth'
import type { CurrentUser } from '../types'
import { isAuthenticationError } from '../../../shared/api/errors'

type Session =
  | { status: 'loading' | 'anonymous' | 'error' }
  | { status: 'authenticated'; user: CurrentUser }

interface AuthStore {
  session: Session
  refresh: (signal?: AbortSignal) => Promise<void>
  signIn: (request: AuthRequest) => Promise<void>
  signOut: () => Promise<void>
  markAnonymous: () => void
}

export const useAuthStore = create<AuthStore>()((set) => {
  let version = 0
  return {
    session: { status: 'loading' },
    refresh: async (signal) => {
      const current = ++version
      set({ session: { status: 'loading' } })
      try {
        const user = await getMe(signal)
        if (!signal?.aborted && current === version) set({ session: { status: 'authenticated', user } })
      } catch (error: unknown) {
        if (signal?.aborted || current !== version) return
        set({ session: { status: isAuthenticationError(error) ? 'anonymous' : 'error' } })
      }
    },
    signIn: async (request) => {
      const current = ++version
      try {
        await login(request)
        const user = await getMe()
        if (current === version) set({ session: { status: 'authenticated', user } })
      } catch (error: unknown) {
        if (current === version) set({ session: { status: isAuthenticationError(error) ? 'anonymous' : 'error' } })
        throw error
      }
    },
    signOut: async () => {
      const current = ++version
      try {
        await logout()
        if (current === version) set({ session: { status: 'anonymous' } })
      } catch (error: unknown) {
        if (isAuthenticationError(error)) {
          if (current === version) set({ session: { status: 'anonymous' } })
          return
        }
        throw error
      }
    },
    markAnonymous: () => {
      version++
      set({ session: { status: 'anonymous' } })
    },
  }
})
