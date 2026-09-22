import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuthStore } from '../stores/auth-store'
import { getCartCount, useCartStore } from '../../cart/stores/cart-store'
import { isAdmin } from '../permissions'

export function AccountNav() {
  const session = useAuthStore(state => state.session)
  const refresh = useAuthStore(state => state.refresh)
  const signOut = useAuthStore(state => state.signOut)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const cartCount = useCartStore(state => getCartCount(state.items))

  return <nav aria-label="Tài khoản" className="border-b border-[#cbd3cd] bg-white px-6 py-4">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
      <Link to="/" className="font-bold tracking-widest text-[#254c40]">TV STORE</Link>
      <div className="flex flex-wrap items-center gap-5">
      <Link to="/cart" className="underline">Giỏ hàng ({cartCount})</Link>
      {session.status === 'loading' && <span role="status">Đang kiểm tra đăng nhập…</span>}
      {session.status === 'anonymous' && <>
        <Link to="/login" className="underline">Đăng nhập</Link><Link to="/register" className="underline">Đăng ký</Link>
      </>}
      {session.status === 'error' && <button type="button" className="cursor-pointer underline" onClick={() => void refresh()}>Không kiểm tra được đăng nhập · Thử lại</button>}
      {session.status === 'authenticated' && <>
        <Link to="/orders" className="underline">Đơn hàng</Link>
        {isAdmin(session.user) && <Link to="/admin" className="underline">Khu quản trị</Link>}
        <span className="break-all">{session.user.email}</span>
        <button type="button" disabled={busy} className="cursor-pointer underline disabled:opacity-50" onClick={async () => {
          if (busy) return
          setBusy(true)
          setError('')
          try {
            await signOut()
            navigate('/')
          } catch {
            setError('Chưa xác nhận được đăng xuất. Hãy thử lại.')
          } finally {
            setBusy(false)
          }
        }}>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
      </>}
      </div>
    </div>
    {error && <p role="alert" className="mx-auto mt-2 max-w-6xl text-red-800">{error}</p>}
  </nav>
}
