import { http } from '../../../shared/api/http'

export interface LowStockProduct { id: number; name: string; brand: string; stock: number }

export async function getLowStockProducts(signal: AbortSignal, threshold = 5): Promise<LowStockProduct[]> {
  return (await http.get<LowStockProduct[]>('/admin/inventory/low-stock', { params: { threshold }, signal })).data
}
