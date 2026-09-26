import { describe, expect, it } from 'vitest'
import { confirmationCodeSchema, emailConfirmationSchema } from './email-confirmation'

describe('email confirmation schemas', () => {
  it('trims resend email', () => {
    expect(emailConfirmationSchema.parse({ email: ' user@example.test ' }))
      .toEqual({ email: 'user@example.test' })
  })

  it('requires both email and confirmation code', () => {
    expect(confirmationCodeSchema.safeParse({ email: 'user@example.test', confirmationCode: '' }).success).toBe(false)
  })
})

