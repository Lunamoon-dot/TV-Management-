import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { isNotFoundError } from '../../../shared/api/errors'
import { OrderStatusBadge } from '../../orders/components/OrderStatusBadge'
import { PaymentSummary } from '../../orders/components/PaymentSummary'
import { getAdminOrderById, type AdminOrderDetailsResponse } from '../api/orders'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })
const statusLabels = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Shipped: 'Đang giao',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
} as const

type DetailsState =
  | { status: 'loading' | 'not-found' | 'error' }
  | { status: 'success'; order: AdminOrderDetailsResponse }

export function AdminOrderDetailsPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const validId = /^\d+$/.test(id ?? '') && Number.isInteger(orderId) && orderId > 0 && orderId <= 2147483647
  const [state, setState] = useState<DetailsState>({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!validId) return
    const controller = new AbortController()
    getAdminOrderById(orderId, controller.signal)
      .then(order => { if (!controller.signal.aborted) setState({ status: 'success', order }) })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: isNotFoundError(error) ? 'not-found' : 'error' })
      })
    return () => controller.abort()
  }, [orderId, retry, validId])

  if (!validId) return <main className="p-10"><h1 className="text-3xl font-bold">Địa chỉ đơn hàng không hợp lệ</h1><Link to="/admin/orders" className="mt-5 inline-block underline">Về danh sách đơn</Link></main>
  if (state.status === 'loading') return <main className="p-10"><p role="status">Đang tải đơn hàng…</p></main>
  if (state.status === 'not-found') return <main className="p-10"><h1 className="text-3xl font-bold">Không tìm thấy đơn hàng</h1><Link to="/admin/orders" className="mt-5 inline-block underline">Về danh sách đơn</Link></main>
  if (state.status === 'error') return <main className="p-10" role="alert"><p>Không tải được đơn hàng.</p><button className="mt-4 cursor-pointer underline" onClick={() => { setState({ status: 'loading' }); setRetry(value => value + 1) }}>Thử lại</button></main>
  if (state.status !== 'success') return null

  const { order } = state
  return <main className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
    <Link to="/admin/orders" className="text-[#254c40] underline">← Về danh sách đơn</Link>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold tracking-[2px] text-[#436b5e]">QUẢN TRỊ / ĐƠN HÀNG</p><h1 className="mt-3 text-4xl font-bold">Đơn #{order.id}</h1></div>
      <OrderStatusBadge status={order.status} />
    </div>
    <p className="mt-3 text-sm text-[#52645e]">{dateTime.format(new Date(order.createdAt))} · {order.customerEmail}</p>

    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border border-[#d2d9d4] bg-white p-6">
        <h2 className="text-xl font-semibold">Giao hàng</h2>
        <dl className="mt-4 space-y-3 text-sm"><div><dt className="font-semibold">Người nhận</dt><dd>{order.recipientName}</dd></div><div><dt className="font-semibold">Điện thoại</dt><dd>{order.phoneNumber}</dd></div><div><dt className="font-semibold">Địa chỉ</dt><dd className="whitespace-pre-wrap">{order.shippingAddress}</dd></div></dl>
      </section>
      <section className="rounded-lg border border-[#d2d9d4] bg-white p-6">
        <h2 className="text-xl font-semibold">Thanh toán</h2>
        <p className="mt-4"><PaymentSummary method={order.paymentMethod} status={order.paymentStatus} /></p>
        {order.paidAt && <p className="mt-3 text-sm text-[#52645e]">Xác nhận {dateTime.format(new Date(order.paidAt))}<br />bởi {order.paymentConfirmedByEmail}</p>}
      </section>
    </div>

    <section className="mt-6 rounded-lg border border-[#d2d9d4] bg-white p-6">
      <h2 className="text-xl font-semibold">Sản phẩm</h2>
      <ul className="mt-4 divide-y divide-[#e1e5e2]">{order.items.map(item => <li key={item.productId} className="flex justify-between gap-5 py-4"><div><p className="font-semibold">{item.productName}</p><p className="text-sm text-[#52645e]">{item.brandName} · {money.format(item.unitPrice)} × {item.quantity}</p></div><p className="font-semibold">{money.format(item.lineTotal)}</p></li>)}</ul>
      <div className="mt-5 flex justify-between border-t border-[#cbd3cd] pt-5 text-xl font-bold"><span>Tổng cộng</span><span>{money.format(order.totalAmount)}</span></div>
    </section>
    <section className="mt-6 rounded-lg border border-[#d2d9d4] bg-white p-6">
      <h2 className="text-xl font-semibold">Lịch sử trạng thái</h2>
      {order.statusHistory.length === 0 ? <p className="mt-4 text-sm text-[#52645e]">Chưa có lịch sử trạng thái.</p> :
        <ol className="mt-5 space-y-5 border-l border-[#9eafa7] pl-5">{order.statusHistory.map((history, index) =>
          <li key={`${history.changedAt}-${index}`} className="relative before:absolute before:-left-[25px] before:top-1.5 before:size-2 before:rounded-full before:bg-[#254c40]">
            <p className="font-semibold">{history.previousStatus ? `${statusLabels[history.previousStatus]} → ` : ''}{statusLabels[history.newStatus]}</p>
            <p className="mt-1 text-sm text-[#52645e]">{dateTime.format(new Date(history.changedAt))} · {history.changedByEmail}</p>
            {history.reason && <p className="mt-1 text-sm">Lý do: {history.reason}</p>}
          </li>)}</ol>}
    </section>
  </main>
}
