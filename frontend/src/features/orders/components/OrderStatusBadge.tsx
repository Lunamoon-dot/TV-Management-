import type { OrderStatus } from '../types'

const statusLabels: Record<OrderStatus, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Shipped: 'Đang giao hàng',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
}

const statusClasses: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-900',
  Confirmed: 'bg-blue-100 text-blue-900',
  Shipped: 'bg-violet-100 text-violet-900',
  Completed: 'bg-emerald-100 text-emerald-900',
  Cancelled: 'bg-red-100 text-red-900',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>
    {statusLabels[status]}
  </span>
}
