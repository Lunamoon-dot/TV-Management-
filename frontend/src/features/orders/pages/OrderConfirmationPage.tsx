import { Link, Navigate, useLocation } from 'react-router'
import type { OrderResponse } from '../types'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

function isOrderResponse(value: unknown): value is OrderResponse {
  if (!value || typeof value !== 'object') return false
  const order = value as Partial<OrderResponse>
  return typeof order.id === 'number'
    && typeof order.createdAt === 'string'
    && typeof order.totalAmount === 'number'
    && Array.isArray(order.items)
}

export function OrderConfirmationPage() {
  const location = useLocation()
  const order = location.state?.order

  if (!isOrderResponse(order)) return <Navigate to="/" replace />

  return <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
    <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">TV STORE / ĐẶT HÀNG THÀNH CÔNG</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Cảm ơn bạn đã đặt hàng.</h1>
    <p className="mt-5 text-[#52645e]">Đơn #{order.id} · {dateTime.format(new Date(order.createdAt))}</p>

    <section className="mt-8 rounded-lg border border-[#d9dfda] bg-white p-6">
      <h2 className="text-xl font-semibold">Chi tiết đơn hàng</h2>
      <ul className="mt-5 divide-y divide-[#e1e5e2]">
        {order.items.map(item => <li key={item.productId} className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0">
          <div>
            <p className="font-semibold">{item.productName}</p>
            <p className="mt-1 text-sm text-[#52645e]">{item.brandName} · {money.format(item.unitPrice)} × {item.quantity}</p>
          </div>
          <p className="font-semibold">{money.format(item.lineTotal)}</p>
        </li>)}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-[#cbd3cd] pt-5 text-xl font-bold">
        <span>Tổng thanh toán</span>
        <span>{money.format(order.totalAmount)}</span>
      </div>
    </section>

    <p className="mt-6 text-sm text-[#52645e]">Thông tin này lấy từ response của backend. Trang lịch sử đơn hàng có thể mở lại sau khi tải lại trình duyệt sẽ được làm ở bài tiếp theo.</p>
    <Link to="/" className="mt-8 inline-block rounded-md bg-[#254c40] px-6 py-3 text-white">Tiếp tục mua sắm</Link>
  </main>
}
