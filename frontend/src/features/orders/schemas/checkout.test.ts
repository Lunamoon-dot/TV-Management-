import { expect, it } from 'vitest'
import { checkoutSchema } from './checkout'

it('trims valid shipping details', () => {
  expect(checkoutSchema.parse({
    recipientName: ' Nguyen Van An ',
    phoneNumber: ' 0901 234 567 ',
    shippingAddress: ' 123 Nguyen Hue, Quan 1 ',
  })).toEqual({
    recipientName: 'Nguyen Van An',
    phoneNumber: '0901 234 567',
    shippingAddress: '123 Nguyen Hue, Quan 1',
  })
})

it('rejects blank details and invalid phone characters', () => {
  expect(checkoutSchema.safeParse({
    recipientName: '  ',
    phoneNumber: '0901abc567',
    shippingAddress: 'short',
  }).success).toBe(false)
})
