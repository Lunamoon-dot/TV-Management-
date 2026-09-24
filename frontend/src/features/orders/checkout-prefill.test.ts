import { describe, expect, it } from 'vitest'
import { prefillCheckout } from './checkout-prefill'

const profile = {
  email: 'customer@example.com',
  fullName: 'Nguyễn Văn An',
  phoneNumber: '0901234567',
  shippingAddress: '12 Nguyễn Huệ, Quận 1',
}

describe('prefillCheckout', () => {
  it('fills empty checkout fields from the customer profile', () => {
    expect(prefillCheckout({
      recipientName: '',
      phoneNumber: '',
      shippingAddress: '',
      paymentMethod: 'CashOnDelivery',
    }, profile)).toEqual({
      recipientName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      shippingAddress: profile.shippingAddress,
      paymentMethod: 'CashOnDelivery',
    })
  })

  it('does not overwrite values already entered for this order', () => {
    const current = {
      recipientName: 'Người nhận khác',
      phoneNumber: '0987654321',
      shippingAddress: '99 Địa chỉ khác, Hà Nội',
      paymentMethod: 'BankTransfer' as const,
    }

    expect(prefillCheckout(current, profile)).toEqual(current)
  })
})

