import { expect, it } from 'vitest'
import { orderNoteSchema } from './order-note'

it('trims a valid internal note', () => {
  expect(orderNoteSchema.parse({ content: '  Đã gọi xác nhận địa chỉ  ' }))
    .toEqual({ content: 'Đã gọi xác nhận địa chỉ' })
})

it('rejects short and overly long internal notes', () => {
  expect(orderNoteSchema.safeParse({ content: '  a ' }).success).toBe(false)
  expect(orderNoteSchema.safeParse({ content: 'a'.repeat(1001) }).success).toBe(false)
})
