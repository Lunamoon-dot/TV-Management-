import { http } from '../../../shared/api/http'

export interface BrandResponse {
  id: number
  name: string
}

export async function getBrands(signal: AbortSignal): Promise<BrandResponse[]> {
  const response = await http.get<BrandResponse[]>('/brands', { signal })
  return response.data
}
