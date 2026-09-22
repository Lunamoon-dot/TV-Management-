import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '../stores/auth-store'

export function RequireAuthenticated({ children }: { children: ReactNode }) {
  const session = useAuthStore(state => state.session)
  const location = useLocation()

  if (session.status === 'loading') return <main className="mx-auto max-w-6xl px-6 py-16" role="status">Đang kiểm tra đăng nhập…</main>
  if (session.status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (session.status === 'error') return <main className="mx-auto max-w-6xl px-6 py-16" role="alert">Không kiểm tra được đăng nhập. Hãy tải lại trang.</main>
  if (session.status !== 'authenticated') return null

  return children
}
