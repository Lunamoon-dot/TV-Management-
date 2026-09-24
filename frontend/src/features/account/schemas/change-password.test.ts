import { describe, expect, it } from 'vitest'
import { changePasswordSchema } from './change-password'

describe('changePasswordSchema', () => {
  it('returns only the two fields required by the API', () => {
    expect(changePasswordSchema.parse({
      currentPassword: 'oldpassword1',
      newPassword: 'newpassword2',
      confirmNewPassword: 'newpassword2',
    })).toEqual({
      currentPassword: 'oldpassword1',
      newPassword: 'newpassword2',
    })
  })

  it('rejects weak and mismatched new passwords', () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: 'oldpassword1',
      newPassword: 'abcdefgh',
      confirmNewPassword: 'different1',
    }).success).toBe(false)
  })
})

