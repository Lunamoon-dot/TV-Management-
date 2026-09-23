import { expect, it } from 'vitest'
import { cancelOrderSchema } from './cancel-order'

it('trims a valid cancellation reason', () => {
  expect(cancelOrderSchema.parse({ reason: '  Tôi đặt nhầm sản phẩm  ' }))
    .toEqual({ reason: 'Tôi đặt nhầm sản phẩm' })
})

it('rejects a blank or overly long cancellation reason', () => {
  expect(cancelOrderSchema.safeParse({ reason: '   ' }).success).toBe(false)
  expect(cancelOrderSchema.safeParse({ reason: 'a'.repeat(301) }).success).toBe(false)
})
