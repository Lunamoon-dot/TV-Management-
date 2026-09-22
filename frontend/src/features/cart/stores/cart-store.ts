import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ProductResponse } from '../../products/types'
import type { CartItem } from '../types'

interface CartStore {
  items: CartItem[]
  addProduct: (product: ProductResponse) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeProduct: (productId: number) => void
  clear: () => void
}

export const useCartStore = create<CartStore>()(persist((set) => ({
  items: [],
  addProduct: (product) => set((state) => {
    if (product.stock <= 0) return state
    const existing = state.items.find(item => item.productId === product.id)
    if (!existing) {
      return {
        items: [...state.items, {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          stock: product.stock,
          quantity: 1,
        }],
      }
    }

    return {
      items: state.items.map(item => item.productId === product.id
        ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
        : item),
    }
  }),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items
      .map(item => item.productId === productId
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) }
        : item)
      .filter(item => item.stock > 0),
  })),
  removeProduct: (productId) => set((state) => ({
    items: state.items.filter(item => item.productId !== productId),
  })),
  clear: () => set({ items: [] }),
}), {
  name: 'tv-store-cart',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: state => ({ items: state.items }),
}))

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}
