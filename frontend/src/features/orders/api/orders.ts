import { getCsrfHeaders } from '../../../shared/api/csrf'
import { http } from '../../../shared/api/http'
import type { CreateOrderRequest, OrderPageResponse, OrderResponse } from '../types'

export async function createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
  const response = await http.post<OrderResponse>('/orders', request, {
    headers: await getCsrfHeaders(),
  })
  return response.data
}

export async function getOrders(signal: AbortSignal, page: number): Promise<OrderPageResponse> {
  const response = await http.get<OrderPageResponse>('/orders', {
    params: { page, pageSize: 10 },
    signal,
  })
  return response.data
}

export async function getOrderById(id: number, signal: AbortSignal): Promise<OrderResponse> {
  return (await http.get<OrderResponse>(`/orders/${id}`, { signal })).data
}

export async function cancelOrder(id: number): Promise<void> {
  await http.post(`/orders/${id}/cancel`, undefined, {
    headers: await getCsrfHeaders(),
  })
}
