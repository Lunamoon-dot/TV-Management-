import { Link } from 'react-router'

export function AdminDashboardPage() {
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
  </main>
}
