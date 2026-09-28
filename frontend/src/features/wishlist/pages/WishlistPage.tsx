import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getWishlist, removeFromWishlist, type WishlistProduct } from '../api/wishlist'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function WishlistPage() {
  const [items, setItems] = useState<WishlistProduct[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const controller = new AbortController()
    getWishlist(controller.signal).then(value => { setItems(value); setStatus('ready') }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [])
  async function remove(id: number) { await removeFromWishlist(id); setItems(current => current.filter(item => item.id !== id)) }
  return <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16"><p className="text-xs font-bold tracking-[2px] text-[#436b5e]">TV STORE / YÊU THÍCH</p><h1 className="mt-3 text-4xl font-bold">Danh sách yêu thích</h1>
    {status === 'loading' && <p role="status" className="mt-8">Đang tải…</p>}{status === 'error' && <p role="alert" className="mt-8 text-red-800">Không tải được danh sách yêu thích.</p>}
    {status === 'ready' && items.length === 0 && <p className="mt-8">Bạn chưa lưu sản phẩm nào.</p>}
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="rounded-lg border border-[#d9dfda] bg-white p-5"><p className="text-sm font-bold tracking-widest text-[#436b5e]">{item.brand}</p><Link to={`/products/${item.id}`} className="mt-3 block text-xl font-semibold underline-offset-4 hover:underline">{item.name}</Link><p className="mt-4 text-xl font-semibold">{money.format(item.price)}</p><p className="mt-2 text-sm text-[#52645e]">{item.stock > 0 ? `Còn ${item.stock} sản phẩm` : 'Hết hàng'}</p><button type="button" onClick={() => void remove(item.id)} className="mt-5 cursor-pointer text-red-800 underline">Bỏ yêu thích</button></article>)}</div></main>
}
