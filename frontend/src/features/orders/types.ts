export interface CreateOrderRequest {
  checkoutId: string
  recipientName: string
  phoneNumber: string
  shippingAddress: string
  paymentMethod: PaymentMethod
  items: Array<{
    productId: number
    quantity: number
  }>
}

export interface OrderItemResponse {
  productId: number
  productName: string
  brandName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderResponse {
  id: number
  createdAt: string
  recipientName: string
  phoneNumber: string
  shippingAddress: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paidAt: string | null
  paymentReference: string | null
  paymentSubmittedAt: string | null
  paymentRejectedReason: string | null
  totalAmount: number
  items: OrderItemResponse[]
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Completed' | 'Cancelled'
export type PaymentMethod = 'CashOnDelivery' | 'BankTransfer' | 'Momo'
export type PaymentStatus = 'Unpaid' | 'PendingReview' | 'Paid' | 'Rejected'

export interface OrderPageResponse {
  items: OrderResponse[]
  totalCount: number
  page: number
  pageSize: number
}
