import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuthStore } from '../../features/auth/stores/auth-store'

const navClass = ({ isActive }: { isActive: boolean }) => isActive
  ? 'rounded-md bg-white/15 px-3 py-2 font-semibold text-white'
  : 'rounded-md px-3 py-2 text-[#d8e5df] hover:bg-white/10 hover:text-white'

export function AdminLayout() {
  const session = useAuthStore(state => state.session)
  const signOut = useAuthStore(state => state.signOut)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const email = session.status === 'authenticated' ? session.user.email : ''

  return <div className="min-h-screen bg-[#eef1ed] lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="bg-[#17352c] px-5 py-6 text-white lg:min-h-screen">
      <Link to="/admin" className="text-lg font-bold tracking-[3px]">TV STORE ADMIN</Link>
      <nav aria-label="Quản trị" className="mt-8 flex flex-wrap gap-2 lg:flex-col">
        <NavLink to="/admin" end className={navClass}>Tổng quan</NavLink>
        <NavLink to="/admin/products" className={navClass}>Sản phẩm</NavLink>
        <NavLink to="/admin/orders" className={navClass}>Đơn hàng</NavLink>
      </nav>
      <div className="mt-8 border-t border-white/20 pt-5 text-sm lg:mt-12">
        <p className="break-all text-[#d8e5df]">{email}</p>
        <Link to="/" className="mt-4 block underline underline-offset-4">Xem cửa hàng</Link>
        <button type="button" disabled={busy} className="mt-4 cursor-pointer underline underline-offset-4 disabled:opacity-50" onClick={async () => {
          if (busy) return
          setBusy(true)
          setError('')
          try {
            await signOut()
            navigate('/')
          } catch {
            setError('Chưa đăng xuất được. Hãy thử lại.')
          } finally {
            setBusy(false)
          }
        }}>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
        {error && <p role="alert" className="mt-3 text-orange-200">{error}</p>}
      </div>
    </aside>
    <div className="min-w-0"><Outlet /></div>
  </div>
}
