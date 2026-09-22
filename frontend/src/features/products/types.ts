export interface ProductResponse {
  id: number
  name: string
  brandId: number
  brand: string
  price: number
  stock: number
}

export type { CreateProductRequest } from './schemas/create-product'
export type UpdateProductRequest = import('./schemas/create-product').CreateProductRequest

export interface ProductPageResponse {
  items: ProductResponse[]
  totalCount: number
  page: number
  pageSize: number
}
