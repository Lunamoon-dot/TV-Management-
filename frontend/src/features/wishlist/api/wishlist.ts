import { getCsrfHeaders } from '../../../shared/api/csrf'
import { http } from '../../../shared/api/http'

export interface WishlistProduct { id: number; name: string; price: number; brand: string; stock: number }

export async function getWishlist(signal: AbortSignal): Promise<WishlistProduct[]> {
  return (await http.get<WishlistProduct[]>('/wishlist', { signal })).data
}
export async function addToWishlist(productId: number): Promise<void> {
  await http.post(`/wishlist/${productId}`, undefined, { headers: await getCsrfHeaders() })
}
export async function removeFromWishlist(productId: number): Promise<void> {
  await http.delete(`/wishlist/${productId}`, { headers: await getCsrfHeaders() })
}
