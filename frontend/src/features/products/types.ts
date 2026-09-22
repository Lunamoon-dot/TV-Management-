export interface ProductResponse {
  id: number
  name: string
  imageUrl: string | null
  screenSizeInches: number | null
  resolution: string | null
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
