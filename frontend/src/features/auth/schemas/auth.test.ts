import { expect, it } from 'vitest'
import { loginSchema, registerSchema } from './auth'

it('trims email but preserves password whitespace', () => {
  const input = { email: ' user@example.test ', password: ' Abcdefghij12! ' }
  expect(registerSchema.parse(input)).toEqual({ email: 'user@example.test', password: input.password })
})
it('rejects weak registration passwords without applying creation policy to login', () => {
  const input = { email: 'user@example.test', password: 'short' }
  expect(registerSchema.safeParse(input).success).toBe(false)
  expect(loginSchema.safeParse(input).success).toBe(true)
  expect(registerSchema.safeParse({ ...input, password: 'abcdefghijklmnop' }).success).toBe(false)
})
