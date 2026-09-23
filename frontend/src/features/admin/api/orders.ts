import { getCsrfHeaders } from '../../../shared/api/csrf'
import { http } from '../../../shared/api/http'
import type { OrderItemResponse, OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/types'

export interface AdminOrderResponse {
  id: number
  customerEmail: string
  createdAt: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paidAt: string | null
  paymentConfirmedByEmail: string | null
  totalAmount: number
  itemCount: number
}

export interface AdminOrderPageResponse {
  items: AdminOrderResponse[]
  totalCount: number
  page: number
  pageSize: number
}

export interface AdminOrderDetailsResponse extends Omit<AdminOrderResponse, 'itemCount'> {
  recipientName: string
  phoneNumber: string
  shippingAddress: string
  items: OrderItemResponse[]
  statusHistory: OrderStatusHistoryResponse[]
}

export interface OrderStatusHistoryResponse {
  previousStatus: OrderStatus | null
  newStatus: OrderStatus
  changedAt: string
  changedByEmail: string
}

export async function getAdminOrders(signal: AbortSignal, page: number): Promise<AdminOrderPageResponse> {
  return (await http.get<AdminOrderPageResponse>('/admin/orders', {
    params: { page, pageSize: 20 },
    signal,
  })).data
}

export async function getAdminOrderById(id: number, signal: AbortSignal): Promise<AdminOrderDetailsResponse> {
  return (await http.get<AdminOrderDetailsResponse>(`/admin/orders/${id}`, { signal })).data
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
  await http.put(`/admin/orders/${id}/status`, { status }, { headers: await getCsrfHeaders() })
}

export async function updatePaymentStatus(id: number, status: PaymentStatus): Promise<void> {
  await http.put(`/admin/orders/${id}/payment-status`, { status }, { headers: await getCsrfHeaders() })
}
