import { describe, expect, it } from 'vitest'
import { profileSchema } from './profile'

describe('profileSchema', () => {
  it('trims valid profile fields', () => {
    expect(profileSchema.parse({
      fullName: '  Nguyễn Văn An  ',
      phoneNumber: ' 0901 234 567 ',
      shippingAddress: '  12 Nguyễn Huệ, Quận 1  ',
    })).toEqual({
      fullName: 'Nguyễn Văn An',
      phoneNumber: '0901 234 567',
      shippingAddress: '12 Nguyễn Huệ, Quận 1',
    })
  })

  it('rejects incomplete and invalid fields', () => {
    const result = profileSchema.safeParse({
      fullName: 'A',
      phoneNumber: 'phone-number',
      shippingAddress: 'ngắn',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.fullName).toBeDefined()
      expect(fields.phoneNumber).toBeDefined()
      expect(fields.shippingAddress).toBeDefined()
    }
  })
})

