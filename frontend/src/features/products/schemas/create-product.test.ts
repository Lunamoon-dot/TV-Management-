import { expect, it } from 'vitest'
import { createProductSchema } from './create-product'

const valid = { name: '  TV Samsung  ', brandId: '2', price: '11990000', stock: '0' }

it('trims the name and converts numeric strings into the JSON request', () => {
  expect(createProductSchema.parse(valid)).toEqual({ name: 'TV Samsung', brandId: 2, price: 11990000, stock: 0 })
})

it.each(['name', 'brandId', 'price', 'stock'])('rejects blank %s instead of treating it as zero', field => {
  for (const value of ['', '   ']) {
    const parsed = createProductSchema.safeParse({ ...valid, [field]: value })
    expect(parsed.success).toBe(false)
    if (!parsed.success) expect(parsed.error.issues[0].path).toEqual([field])
  }
})

it.each([
  ['brandId', '0'], ['brandId', '1.5'], ['brandId', '2147483648'],
  ['stock', '-1'], ['stock', '1.5'], ['stock', '2147483648'],
  ['price', '0'], ['price', '-1'], ['price', '1.001'], ['price', '1e16'],
  ['price', 'NaN'], ['price', 'Infinity'], ['stock', 'abc'],
])('rejects invalid %s=%s', (field, value) => {
  expect(createProductSchema.safeParse({ ...valid, [field]: value }).success).toBe(false)
})

it('accepts cents and the C# int stock boundary', () => {
  expect(createProductSchema.safeParse({ ...valid, price: '0.01', stock: '2147483647' }).success).toBe(true)
})
