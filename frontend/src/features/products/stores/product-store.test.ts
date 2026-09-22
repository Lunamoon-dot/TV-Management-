import { beforeEach, expect, it, vi } from 'vitest'
import { getProducts } from '../api/products'
import { useProductStore } from './product-store'
import type { ProductPageResponse } from '../types'

vi.mock('../api/products', () => ({ getProducts: vi.fn() }))
const request = vi.mocked(getProducts)
const empty: ProductPageResponse = { items: [], totalCount: 0, page: 1, pageSize: 20 }

beforeEach(() => {
  useProductStore.getState().cancelLoad()
  useProductStore.setState({ result: { status: 'idle' }, requestedPage: 1, search: '', brandId: undefined })
  request.mockReset()
})

it('treats an empty response as success, not an error', async () => {
  request.mockResolvedValue(empty)
  const pending = useProductStore.getState().loadProducts()
  expect(useProductStore.getState().result.status).toBe('loading')
  await pending
  expect(useProductStore.getState().result).toEqual({ status: 'success', data: empty })
})

it('handles HTTP errors and recovers on retry', async () => {
  request.mockRejectedValue({ isAxiosError: true, response: { status: 502 } })
  await useProductStore.getState().loadProducts()
  expect(useProductStore.getState().result).toEqual({ status: 'error', message: expect.stringContaining('502') })
  request.mockResolvedValue(empty)
  await useProductStore.getState().loadProducts()
  expect(useProductStore.getState().result.status).toBe('success')
})

it('does not let an older response replace the latest result', async () => {
  let resolveOld!: (data: ProductPageResponse) => void
  request.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
  const oldRequest = useProductStore.getState().loadProducts()
  request.mockResolvedValue(empty)
  await useProductStore.getState().loadProducts()
  expect(request.mock.calls[0][0].aborted).toBe(true)
  resolveOld({ ...empty, totalCount: 99 })
  await oldRequest
  expect(useProductStore.getState().result).toEqual({ status: 'success', data: empty })
})

it('ignores errors from a request cancelled on unmount', async () => {
  let rejectOld!: (reason: Error) => void
  request.mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject }))
  const pending = useProductStore.getState().loadProducts()
  useProductStore.getState().cancelLoad()
  rejectOld(new Error('cancelled'))
  await pending
  expect(useProductStore.getState().result.status).toBe('idle')
})

it('requests the selected page and retries that page after a failure', async () => {
  request.mockRejectedValueOnce(new Error('offline'))
  await useProductStore.getState().loadProducts(2)
  expect(request.mock.calls[0][1]).toBe(2)
  request.mockResolvedValue({ ...empty, page: 2, pageSize: 2 })
  await useProductStore.getState().loadProducts()
  expect(request.mock.calls[1][1]).toBe(2)
  expect(useProductStore.getState().result).toEqual({
    status: 'success', data: { ...empty, page: 2, pageSize: 2 },
  })
})

it('resets to page one on search and preserves the term on paging and retry', async () => {
  request.mockResolvedValue(empty)
  await useProductStore.getState().loadProducts(2)
  await useProductStore.getState().searchProducts('  55 inch  ')
  expect(request.mock.lastCall?.slice(1, 3)).toEqual([1, '55 inch'])
  await useProductStore.getState().loadProducts(2)
  expect(request.mock.lastCall?.slice(1, 3)).toEqual([2, '55 inch'])
  await useProductStore.getState().loadProducts()
  expect(request.mock.lastCall?.slice(1, 3)).toEqual([2, '55 inch'])
  await useProductStore.getState().searchProducts('')
  expect(request.mock.lastCall?.slice(1, 3)).toEqual([1, ''])
})


it('combines brand and search, resets the page, and preserves both on paging', async () => {
  request.mockResolvedValue(empty)
  await useProductStore.getState().searchProducts('55 inch')
  await useProductStore.getState().loadProducts(2)
  await useProductStore.getState().filterByBrand(2)
  expect(request.mock.lastCall?.slice(1)).toEqual([1, '55 inch', 2])
  await useProductStore.getState().loadProducts(2)
  expect(request.mock.lastCall?.slice(1)).toEqual([2, '55 inch', 2])
  await useProductStore.getState().loadProducts()
  expect(request.mock.lastCall?.slice(1)).toEqual([2, '55 inch', 2])
  await useProductStore.getState().searchProducts('Samsung')
  expect(request.mock.lastCall?.slice(1)).toEqual([1, 'Samsung', 2])
  await useProductStore.getState().filterByBrand(undefined)
  expect(request.mock.lastCall?.slice(1)).toEqual([1, 'Samsung', undefined])
})
