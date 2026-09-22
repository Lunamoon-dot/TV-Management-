import type { PaymentMethod, PaymentStatus } from '../types'

const methodLabels: Record<PaymentMethod, string> = {
  CashOnDelivery: 'Thanh toán khi nhận hàng',
  BankTransfer: 'Chuyển khoản ngân hàng',
}

const statusLabels: Record<PaymentStatus, string> = {
  Unpaid: 'Chưa thanh toán',
  Paid: 'Đã thanh toán',
}

export function PaymentSummary({ method, status }: { method: PaymentMethod; status: PaymentStatus }) {
  return <span>{methodLabels[method]} · {statusLabels[status]}</span>
}
