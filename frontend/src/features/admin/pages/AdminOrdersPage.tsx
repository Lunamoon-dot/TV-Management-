import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { OrderStatusBadge } from '../../orders/components/OrderStatusBadge'
import { PaymentSummary } from '../../orders/components/PaymentSummary'
import type { OrderStatus } from '../../orders/types'
import { getAdminOrders, updateOrderStatus, updatePaymentStatus, type AdminOrderPageResponse } from '../api/orders'
import { cancelOrderSchema } from '../../orders/schemas/cancel-order'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

const actions: Partial<Record<OrderStatus, Array<{ status: OrderStatus; label: string }>>> = {
  Pending: [{ status: 'Confirmed', label: 'Xác nhận' }, { status: 'Cancelled', label: 'Hủy đơn' }],
  Confirmed: [{ status: 'Shipped', label: 'Bắt đầu giao' }, { status: 'Cancelled', label: 'Hủy đơn' }],
  Shipped: [{ status: 'Completed', label: 'Hoàn thành' }],
}

type PageState =
  | { status: 'loading' | 'error' }
  | { status: 'success'; data: AdminOrderPageResponse }

export function AdminOrdersPage() {
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState<PageState>({ status: 'loading' })
  const [updatingId, setUpdatingId] = useState<number>()
  const [error, setError] = useState('')
  const [cancellationTarget, setCancellationTarget] = useState<number>()
  const [cancellationReason, setCancellationReason] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAdminOrders(controller.signal, page)
      .then(data => {
        if (!controller.signal.aborted) setState({ status: 'success', data })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [page, retry])

  async function changeStatus(id: number, status: OrderStatus, reason?: string) {
    if (updatingId !== undefined) return
    setUpdatingId(id)
    setError('')
    try {
      await updateOrderStatus(id, status, reason)
      setState(current => current.status === 'success'
        ? { status: 'success', data: { ...current.data, items: current.data.items.map(order => order.id === id ? { ...order, status } : order) } }
        : current)
    } catch {
      setError('Không cập nhật được trạng thái. Hãy tải lại danh sách và thử lại.')
    } finally {
      setUpdatingId(undefined)
    }
  }

  function submitCancellation(id: number) {
    const parsed = cancelOrderSchema.safeParse({ reason: cancellationReason })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Lý do hủy không hợp lệ.')
      return
    }
    setCancellationTarget(undefined)
    setCancellationReason('')
    void changeStatus(id, 'Cancelled', parsed.data.reason)
  }

  function beginCancellation(id: number) {
    setCancellationTarget(id)
    setCancellationReason('')
    setError('')
  }

  async function markPaid(id: number) {
    if (updatingId !== undefined) return
    setUpdatingId(id)
    setError('')
    try {
      await updatePaymentStatus(id, 'Paid')
      setState({ status: 'loading' })
      setRetry(value => value + 1)
    } catch {
      setError('Không xác nhận được thanh toán. Hãy tải lại danh sách và thử lại.')
    } finally {
      setUpdatingId(undefined)
    }
  }

  return <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
    <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">QUẢN TRỊ / ĐƠN HÀNG</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Xử lý đơn hàng.</h1>

    {error && <p role="alert" className="mt-6 text-red-800">{error}</p>}
    {state.status === 'loading' && <p role="status" className="mt-8">Đang tải đơn hàng…</p>}
    {state.status === 'error' && <div role="alert" className="mt-8 rounded-md border border-orange-200 bg-orange-50 p-5 text-orange-900">
      <p>Không tải được danh sách đơn.</p>
      <button type="button" className="mt-3 cursor-pointer underline" onClick={() => {
        setState({ status: 'loading' })
        setRetry(value => value + 1)
      }}>Thử lại</button>
    </div>}
    {state.status === 'success' && <>
      {state.data.items.length === 0 ? <p className="mt-8">Chưa có đơn hàng.</p> : <div className="mt-8 overflow-x-auto rounded-lg border border-[#d2d9d4] bg-white">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-[#d2d9d4] bg-[#f7f8f6] text-sm text-[#52645e]"><tr>
            <th className="px-5 py-4">Đơn</th><th className="px-5 py-4">Khách hàng</th><th className="px-5 py-4">Tổng tiền</th><th className="px-5 py-4">Thanh toán</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Thao tác</th>
          </tr></thead>
          <tbody className="divide-y divide-[#e1e5e2]">{state.data.items.map(order => <tr key={order.id}>
            <td className="px-5 py-4"><Link to={`/admin/orders/${order.id}`} className="font-semibold underline underline-offset-4">#{order.id}</Link><p className="mt-1 text-xs text-[#52645e]">{dateTime.format(new Date(order.createdAt))} · {order.itemCount} dòng</p></td>
            <td className="px-5 py-4">{order.customerEmail}</td>
            <td className="px-5 py-4 font-semibold">{money.format(order.totalAmount)}</td>
            <td className="px-5 py-4 text-sm"><PaymentSummary method={order.paymentMethod} status={order.paymentStatus} />
              {order.paidAt && <p className="mt-1 text-xs text-[#52645e]">{dateTime.format(new Date(order.paidAt))}<br />{order.paymentConfirmedByEmail}</p>}
              {order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled' && <button type="button" disabled={updatingId !== undefined}
                className="mt-2 block cursor-pointer underline disabled:cursor-wait disabled:opacity-40"
                onClick={() => void markPaid(order.id)}>{order.paymentMethod === 'BankTransfer' ? 'Xác nhận chuyển khoản' : 'Xác nhận đã thu tiền'}</button>}
            </td>
            <td className="px-5 py-4"><OrderStatusBadge status={order.status} /></td>
            <td className="px-5 py-4"><div className="flex gap-3">{(actions[order.status] ?? []).filter(action => action.status !== 'Cancelled' || order.paymentStatus === 'Unpaid').map(action => <button key={action.status} type="button" disabled={updatingId !== undefined}
              className="cursor-pointer underline disabled:cursor-wait disabled:opacity-40" onClick={() => action.status === 'Cancelled' ? beginCancellation(order.id) : void changeStatus(order.id, action.status)}>{action.label}</button>)}</div>
              {cancellationTarget === order.id && <form className="mt-3 w-64" onSubmit={event => { event.preventDefault(); submitCancellation(order.id) }}>
                <label htmlFor={`admin-cancel-${order.id}`} className="text-sm font-semibold">Lý do hủy</label>
                <textarea id={`admin-cancel-${order.id}`} value={cancellationReason} maxLength={300} rows={2} onChange={event => setCancellationReason(event.target.value)} className="mt-1 w-full rounded border border-[#b8c4bd] p-2 text-sm" />
                <div className="mt-2 flex gap-3 text-sm"><button type="submit" className="cursor-pointer font-semibold text-red-800 underline">Xác nhận</button><button type="button" className="cursor-pointer underline" onClick={() => setCancellationTarget(undefined)}>Đóng</button></div>
              </form>}
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
      <nav aria-label="Phân trang đơn quản trị" className="mt-8 flex items-center justify-between">
        <button type="button" disabled={page <= 1} className="cursor-pointer underline disabled:opacity-40" onClick={() => { setState({ status: 'loading' }); setPage(value => value - 1) }}>Trang trước</button>
        <span>Trang {state.data.page}</span>
        <button type="button" disabled={page * state.data.pageSize >= state.data.totalCount} className="cursor-pointer underline disabled:opacity-40" onClick={() => { setState({ status: 'loading' }); setPage(value => value + 1) }}>Trang sau</button>
      </nav>
    </>}
  </main>
}
