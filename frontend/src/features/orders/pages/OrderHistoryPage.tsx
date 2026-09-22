import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getOrders } from '../api/orders'
import type { OrderPageResponse } from '../types'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { PaymentSummary } from '../components/PaymentSummary'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

type HistoryState =
  | { status: 'loading' | 'error' }
  | { status: 'success'; data: OrderPageResponse }

export function OrderHistoryPage() {
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState<HistoryState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    getOrders(controller.signal, page)
      .then(data => {
        if (!controller.signal.aborted) setState({ status: 'success', data })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [page, retry])

  return <main className="mx-auto max-w-4xl px-6 py-10 sm:py-16">
    <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">TÀI KHOẢN / ĐƠN HÀNG</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Đơn hàng của bạn.</h1>

    {state.status === 'loading' && <p role="status" className="mt-8">Đang tải lịch sử đơn hàng…</p>}
    {state.status === 'error' && <div role="alert" className="mt-8 rounded-md border border-orange-200 bg-orange-50 p-5 text-orange-900">
      <p>Không tải được lịch sử đơn hàng.</p>
      <button type="button" className="mt-3 cursor-pointer underline" onClick={() => {
        setState({ status: 'loading' })
        setRetry(value => value + 1)
      }}>Thử lại</button>
    </div>}
    {state.status === 'success' && <>
      {state.data.items.length === 0 ? <p className="mt-8">Bạn chưa có đơn hàng nào.</p> :
        <ul className="mt-8 space-y-4">
          {state.data.items.map(order => <li key={order.id} className="rounded-lg border border-[#d9dfda] bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">Đơn #{order.id}</p>
                <div className="mt-2"><OrderStatusBadge status={order.status} /></div>
                <p className="mt-2 text-sm text-[#52645e]"><PaymentSummary method={order.paymentMethod} status={order.paymentStatus} /></p>
                <p className="mt-1 text-sm text-[#52645e]">{dateTime.format(new Date(order.createdAt))} · {order.items.length} dòng sản phẩm</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xl font-bold">{money.format(order.totalAmount)}</p>
                <Link to={`/orders/${order.id}`} className="mt-2 inline-block text-[#254c40] underline">Xem chi tiết</Link>
              </div>
            </div>
          </li>)}
        </ul>}
      <nav aria-label="Phân trang đơn hàng" className="mt-8 flex items-center justify-between">
        <button type="button" disabled={page <= 1} className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-40" onClick={() => {
          setState({ status: 'loading' })
          setPage(value => value - 1)
        }}>Trang trước</button>
        <span>Trang {state.data.page}</span>
        <button type="button" disabled={page * state.data.pageSize >= state.data.totalCount} className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-40" onClick={() => {
          setState({ status: 'loading' })
          setPage(value => value + 1)
        }}>Trang sau</button>
      </nav>
    </>}
  </main>
}
