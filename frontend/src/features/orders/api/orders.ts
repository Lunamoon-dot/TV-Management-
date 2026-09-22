import { getCsrfHeaders } from '../../../shared/api/csrf'
import { http } from '../../../shared/api/http'
import type { CreateOrderRequest, OrderResponse } from '../types'

export async function createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
  const response = await http.post<OrderResponse>('/orders', request, {
    headers: await getCsrfHeaders(),
  })
  return response.data
}
