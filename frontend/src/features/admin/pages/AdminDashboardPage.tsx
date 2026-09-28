import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getLowStockProducts, type LowStockProduct } from '../api/inventory'

export function AdminDashboardPage() {
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
  useEffect(() => { const controller = new AbortController(); getLowStockProducts(controller.signal).then(setLowStock).catch(() => undefined); return () => controller.abort() }, [])
  return <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
    <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">KHU QUẢN TRỊ</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Tổng quan cửa hàng.</h1>
    <p className="mt-5 max-w-2xl text-[#52645e]">Đây là giao diện dành cho Admin. Catalog, giỏ hàng và đặt hàng của Customer nằm ở website cửa hàng riêng.</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      <Link to="/admin/products" className="rounded-lg border border-[#d2d9d4] bg-white p-6 hover:border-[#254c40]">
        <p className="text-sm font-bold tracking-widest text-[#436b5e]">CATALOG</p>
        <h2 className="mt-3 text-2xl font-semibold">Quản lý sản phẩm</h2>
        <p className="mt-3 text-[#52645e]">Xem danh sách, tạo mới và sửa thông tin TV.</p>
      </Link>
      <Link to="/admin/orders" className="rounded-lg border border-[#d2d9d4] bg-white p-6 hover:border-[#254c40]">
        <p className="text-sm font-bold tracking-widest text-[#436b5e]">ORDERS</p>
        <h2 className="mt-3 text-2xl font-semibold">Xử lý đơn hàng</h2>
        <p className="mt-3 text-[#52645e]">Xác nhận, giao, hoàn thành hoặc hủy đơn.</p>
      </Link>
    </div>
    <section className="mt-8 rounded-lg border border-[#d2d9d4] bg-white p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Sắp hết hàng</h2><Link to="/admin/products" className="underline">Quản lý sản phẩm</Link></div>{lowStock.length === 0 ? <p className="mt-4 text-[#52645e]">Không có sản phẩm dưới ngưỡng 5.</p> : <ul className="mt-4 divide-y divide-[#e1e5e2]">{lowStock.map(product => <li key={product.id} className="flex justify-between gap-4 py-3"><span>{product.brand} · {product.name}</span><strong className={product.stock === 0 ? 'text-red-800' : 'text-orange-800'}>{product.stock} còn lại</strong></li>)}</ul>}</section>
  </main>
}
