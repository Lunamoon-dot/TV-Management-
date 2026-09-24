import type { CustomerProfile } from '../account/types'
import type { CheckoutFormInput } from './schemas/checkout'

export function prefillCheckout(
  current: CheckoutFormInput,
  profile: CustomerProfile,
): CheckoutFormInput {
  return {
    ...current,
    recipientName: current.recipientName || profile.fullName || '',
    phoneNumber: current.phoneNumber || profile.phoneNumber || '',
    shippingAddress: current.shippingAddress || profile.shippingAddress || '',
  }
}

