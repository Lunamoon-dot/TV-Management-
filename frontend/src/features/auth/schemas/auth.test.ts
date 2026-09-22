import { expect, it } from 'vitest'
import { loginSchema, registerSchema } from './auth'

it('trims email but preserves password whitespace', () => {
  const input = { email: ' user@example.test ', password: ' Abcdefghij12! ', confirmPassword: ' Abcdefghij12! ' }
  expect(registerSchema.parse(input)).toEqual({ email: 'user@example.test', password: input.password })
})
it('rejects weak registration passwords without applying creation policy to login', () => {
  const input = { email: 'user@example.test', password: 'short', confirmPassword: 'short' }
  expect(registerSchema.safeParse(input).success).toBe(false)
  expect(loginSchema.safeParse(input).success).toBe(true)
  expect(registerSchema.safeParse({ ...input, password: 'abcdefghijklmnop', confirmPassword: 'abcdefghijklmnop' }).success).toBe(false)
  expect(registerSchema.safeParse({ ...input, password: 'huytp231', confirmPassword: 'huytp231' }).success).toBe(true)
})
it('rejects a mismatched confirmation and omits it from the API request', () => {
  const input = { email: 'user@example.test', password: 'StrongPassword-123!', confirmPassword: 'DifferentPassword-123!' }
  const mismatch = registerSchema.safeParse(input)
  expect(mismatch.success).toBe(false)
  if (!mismatch.success) expect(mismatch.error.issues[0].path).toEqual(['confirmPassword'])

  expect(registerSchema.parse({ ...input, confirmPassword: input.password })).toEqual({
    email: input.email,
    password: input.password,
  })
})
