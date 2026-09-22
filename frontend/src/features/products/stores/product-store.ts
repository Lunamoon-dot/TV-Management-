import axios from 'axios'
import { create } from 'zustand'
import { getProducts } from '../api/products'
import type { ProductPageResponse } from '../types'

type ProductLoadState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: ProductPageResponse }

interface ProductStore {
  result: ProductLoadState
  requestedPage: number
  search: string
  brandId: number | undefined
  filterByBrand: (brandId: number | undefined) => Promise<void>
  searchProducts: (search: string) => Promise<void>
  loadProducts: (page?: number) => Promise<void>
  cancelLoad: () => void
}

export const useProductStore = create<ProductStore>()((set, get) => {
  let activeController: AbortController | undefined

  return {
    result: { status: 'idle' },
    requestedPage: 1,
    search: '',
    brandId: undefined,
    filterByBrand: async (brandId) => {
      set({ brandId })
      await get().loadProducts(1)
    },
    searchProducts: async (search) => {
      set({ search: search.trim() })
      await get().loadProducts(1)
    },
    loadProducts: async (page = get().requestedPage) => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller
      set({ result: { status: 'loading' }, requestedPage: page })
      try {
        const data = await getProducts(controller.signal, page, get().search, get().brandId)
        if (!controller.signal.aborted) set({ result: { status: 'success', data } })
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        const message = status
          ? `Không tải được danh sách TV (HTTP ${status}). Hãy thử lại.`
          : 'Không kết nối được API hoặc yêu cầu quá thời gian. Hãy thử lại.'
        set({ result: { status: 'error', message } })
      } finally {
        if (activeController === controller) activeController = undefined
      }
    },
    cancelLoad: () => {
      activeController?.abort()
      activeController = undefined
      set(state => state.result.status === 'loading' ? { result: { status: 'idle' } } : {})
    },
  }
})
