import type { PaymentMethod, PaymentStatus } from '../types'

const methodLabels: Record<PaymentMethod, string> = {
  CashOnDelivery: 'Thanh toán khi nhận hàng',
  BankTransfer: 'Chuyển khoản ngân hàng',
  Momo: 'MoMo',
}

const statusLabels: Record<PaymentStatus, string> = {
  Unpaid: 'Chưa thanh toán',
  PendingReview: 'Đang chờ xác nhận',
  Paid: 'Đã thanh toán',
  Rejected: 'Bị từ chối',
}

export function PaymentSummary({ method, status }: { method: PaymentMethod; status: PaymentStatus }) {
  return <span>{methodLabels[method]} · {statusLabels[status]}</span>
}
