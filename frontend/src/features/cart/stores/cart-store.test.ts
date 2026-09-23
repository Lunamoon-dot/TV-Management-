import { beforeEach, expect, it } from 'vitest'
import { getCartCount, getCartTotal, useCartStore } from './cart-store'
import type { ProductResponse } from '../../products/types'

const product: ProductResponse = {
  rowVersion: 'AAAAAAAAAAA=',
  id: 1,
  name: 'Samsung 4K 55 inch',
  imageUrl: 'https://example.test/tv.jpg',
  screenSizeInches: 55,
  resolution: '4K UHD',
  brandId: 2,
  brand: 'Samsung',
  price: 11990000,
  stock: 2,
}

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

it('adds a product snapshot to the cart', () => {
  useCartStore.getState().addProduct(product)
  expect(useCartStore.getState().items).toEqual([{
    productId: 1,
    name: 'Samsung 4K 55 inch',
    brand: 'Samsung',
    price: 11990000,
    stock: 2,
    quantity: 1,
  }])
})

it('increments quantity without exceeding stock', () => {
  useCartStore.getState().addProduct(product)
  useCartStore.getState().addProduct(product)
  useCartStore.getState().addProduct(product)
  expect(useCartStore.getState().items[0].quantity).toBe(2)
})

it('does not add out-of-stock products', () => {
  useCartStore.getState().addProduct({ ...product, stock: 0 })
  expect(useCartStore.getState().items).toEqual([])
})

it('updates quantity within product stock', () => {
  useCartStore.getState().addProduct(product)
  useCartStore.getState().updateQuantity(1, 10)
  expect(useCartStore.getState().items[0].quantity).toBe(2)
  useCartStore.getState().updateQuantity(1, -5)
  expect(useCartStore.getState().items[0].quantity).toBe(1)
})

it('removes products and calculates totals', () => {
  useCartStore.getState().addProduct(product)
  useCartStore.getState().updateQuantity(1, 2)
  expect(getCartCount(useCartStore.getState().items)).toBe(2)
  expect(getCartTotal(useCartStore.getState().items)).toBe(23980000)
  useCartStore.getState().removeProduct(1)
  expect(useCartStore.getState().items).toEqual([])
})
