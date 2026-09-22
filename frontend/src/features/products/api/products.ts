import { http } from '../../../shared/api/http'
import { getCsrfHeaders } from '../../../shared/api/csrf'
import type { CreateProductRequest, UpdateProductRequest, ProductPageResponse, ProductResponse } from '../types'

export async function getProducts(signal: AbortSignal, page: number, search: string, brandId?: number, pageSize = 2): Promise<ProductPageResponse> {
  const response = await http.get<ProductPageResponse>('/products', {
    params: { page, pageSize, search: search || undefined, brandId },
    signal,
  })
  return response.data
}

export async function getProductById(id: number, signal: AbortSignal): Promise<ProductResponse> {
  const response = await http.get<ProductResponse>(`/products/${id}`, { signal })
  return response.data
}

export async function createProduct(request: CreateProductRequest): Promise<ProductResponse> {
  const response = await http.post<ProductResponse>('/products', request, { headers: await getCsrfHeaders() })
  return response.data
}

export async function updateProduct(id: number, request: UpdateProductRequest): Promise<void> {
  await http.put(`/products/${id}`, request, { headers: await getCsrfHeaders() })
}
