import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { isAdmin } from '../permissions'
import { useAuthStore } from '../stores/auth-store'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = useAuthStore(state => state.session)
  const location = useLocation()

  if (session.status === 'loading') return <main className="mx-auto max-w-6xl px-6 py-16" role="status">Đang kiểm tra quyền truy cập…</main>
  if (session.status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (session.status === 'error') return <main className="mx-auto max-w-6xl px-6 py-16" role="alert">Không kiểm tra được quyền truy cập. Hãy tải lại trang.</main>
  if (session.status !== 'authenticated') return null
  if (!isAdmin(session.user)) return <main className="mx-auto max-w-6xl px-6 py-16">
    <h1 className="text-3xl font-bold">Bạn không có quyền quản lý TV</h1>
    <Link to="/" className="mt-5 inline-block underline">Về danh sách TV</Link>
  </main>

  return children
}
