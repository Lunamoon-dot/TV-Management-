export interface CreateOrderRequest {
  recipientName: string
  phoneNumber: string
  shippingAddress: string
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
  totalAmount: number
  items: OrderItemResponse[]
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Completed' | 'Cancelled'

export interface OrderPageResponse {
  items: OrderResponse[]
  totalCount: number
  page: number
  pageSize: number
}
