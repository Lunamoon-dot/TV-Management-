export interface CreateOrderRequest {
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
  totalAmount: number
  items: OrderItemResponse[]
}
