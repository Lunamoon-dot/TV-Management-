import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { isAuthenticationError, isNotFoundError, isValidationError } from '../../../shared/api/errors'
import { cancelOrder, getOrderById } from '../api/orders'
import type { OrderResponse } from '../types'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { PaymentSummary } from '../components/PaymentSummary'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

type DetailsState =
  | { status: 'loading' | 'not-found' | 'error' }
  | { status: 'success'; order: OrderResponse }

export function OrderConfirmationPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const validId = /^\d+$/.test(id ?? '') && Number.isInteger(orderId) && orderId > 0 && orderId <= 2147483647

  return <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
    {validId ? <OrderDetails key={orderId} id={orderId} /> : <h1 className="text-3xl font-bold">Địa chỉ đơn hàng không hợp lệ</h1>}
  </main>
}

function OrderDetails({ id }: { id: number }) {
  const [state, setState] = useState<DetailsState>({ status: 'loading' })
  const [retry, setRetry] = useState(0)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  async function cancel(order: OrderResponse) {
    if (cancelling || !window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return
    setCancelling(true)
    setCancelError('')
    try {
      await cancelOrder(order.id)
      setState({ status: 'success', order: { ...order, status: 'Cancelled' } })
    } catch (error: unknown) {
      if (isAuthenticationError(error)) setCancelError('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.')
      else if (isValidationError(error)) setCancelError('Đơn hàng không còn ở trạng thái có thể hủy.')
      else setCancelError('Chưa hủy được đơn hàng. Hãy thử lại.')
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    getOrderById(id, controller.signal)
      .then(order => {
        if (!controller.signal.aborted) setState({ status: 'success', order })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: isNotFoundError(error) ? 'not-found' : 'error' })
      })
    return () => controller.abort()
  }, [id, retry])

  if (state.status === 'loading') return <p role="status">Đang tải đơn hàng…</p>
  if (state.status === 'not-found') return <div>
    <h1 className="text-3xl font-bold">Không tìm thấy đơn hàng</h1>
    <p className="mt-4 text-[#52645e]">Đơn không tồn tại hoặc không thuộc tài khoản của bạn.</p>
    <Link to="/orders" className="mt-6 inline-block underline">Về lịch sử đơn hàng</Link>
  </div>
  if (state.status === 'error') return <div role="alert">
    <p>Không tải được đơn hàng.</p>
    <button type="button" className="mt-4 cursor-pointer underline" onClick={() => {
      setState({ status: 'loading' })
      setRetry(value => value + 1)
    }}>Thử lại</button>
  </div>
  if (state.status !== 'success') return null

  const { order } = state
  return <>
    <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">TV STORE / ĐƠN HÀNG</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Đơn hàng #{order.id}</h1>
    <div className="mt-5 flex flex-wrap items-center gap-3"><OrderStatusBadge status={order.status} /><span className="text-[#52645e]">{dateTime.format(new Date(order.createdAt))}</span></div>
    {order.status === 'Pending' && order.paymentStatus === 'Unpaid' && <div className="mt-6">
      <button type="button" disabled={cancelling} onClick={() => void cancel(order)}
        className="cursor-pointer rounded-md border border-red-800 px-4 py-2 text-red-800 disabled:cursor-wait disabled:opacity-60">
        {cancelling ? 'Đang hủy…' : 'Hủy đơn hàng'}
      </button>
    </div>}
    {cancelError && <p role="alert" className="mt-3 text-sm text-red-800">{cancelError}</p>}
    <section className="mt-8 rounded-lg border border-[#d9dfda] bg-white p-6">
      <h2 className="text-xl font-semibold">Thông tin giao hàng</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div><dt className="font-semibold">Người nhận</dt><dd className="mt-1 text-[#52645e]">{order.recipientName}</dd></div>
        <div><dt className="font-semibold">Số điện thoại</dt><dd className="mt-1 text-[#52645e]">{order.phoneNumber}</dd></div>
        <div><dt className="font-semibold">Địa chỉ</dt><dd className="mt-1 whitespace-pre-wrap text-[#52645e]">{order.shippingAddress}</dd></div>
        <div><dt className="font-semibold">Thanh toán</dt><dd className="mt-1 text-[#52645e]"><PaymentSummary method={order.paymentMethod} status={order.paymentStatus} /></dd></div>
        {order.paidAt && <div><dt className="font-semibold">Xác nhận lúc</dt><dd className="mt-1 text-[#52645e]">{dateTime.format(new Date(order.paidAt))}</dd></div>}
      </dl>
    </section>
    <section className="mt-8 rounded-lg border border-[#d9dfda] bg-white p-6">
      <h2 className="text-xl font-semibold">Chi tiết đơn hàng</h2>
      <ul className="mt-5 divide-y divide-[#e1e5e2]">
        {order.items.map(item => <li key={item.productId} className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0">
          <div><p className="font-semibold">{item.productName}</p><p className="mt-1 text-sm text-[#52645e]">{item.brandName} · {money.format(item.unitPrice)} × {item.quantity}</p></div>
          <p className="font-semibold">{money.format(item.lineTotal)}</p>
        </li>)}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-[#cbd3cd] pt-5 text-xl font-bold"><span>Tổng thanh toán</span><span>{money.format(order.totalAmount)}</span></div>
    </section>
    <div className="mt-8 flex flex-wrap gap-5"><Link to="/orders" className="underline">Lịch sử đơn hàng</Link><Link to="/" className="underline">Tiếp tục mua sắm</Link></div>
  </>
}
