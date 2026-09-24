import { describe, expect, it } from 'vitest'
import { forgotPasswordSchema, resetPasswordSchema } from './password-recovery'

describe('password recovery schemas', () => {
  it('normalizes the forgot-password email', () => {
    expect(forgotPasswordSchema.parse({ email: ' user@example.test ' }))
      .toEqual({ email: 'user@example.test' })
  })

  it('omits confirmation from the reset request', () => {
    expect(resetPasswordSchema.parse({
      email: 'user@example.test',
      resetCode: 'reset-code',
      newPassword: 'newpassword2',
      confirmNewPassword: 'newpassword2',
    })).toEqual({
      email: 'user@example.test',
      resetCode: 'reset-code',
      newPassword: 'newpassword2',
    })
  })

  it('rejects weak or mismatched passwords', () => {
    expect(resetPasswordSchema.safeParse({
      email: 'user@example.test',
      resetCode: 'reset-code',
      newPassword: 'abcdefgh',
      confirmNewPassword: 'different1',
    }).success).toBe(false)
  })
})

