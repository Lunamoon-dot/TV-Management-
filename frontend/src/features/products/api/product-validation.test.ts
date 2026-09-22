import { expect, it } from 'vitest'
import { readProductValidation } from './product-validation'

it('maps ASP.NET property names and JSON conversion paths to form fields', () => {
  expect(readProductValidation({ errors: { Name: ['Required'], BrandId: ['Unknown brand'], '$.price': ['Invalid number'], Stock: ['Out of range'] } }))
    .toEqual({ name: ['Required'], brandId: ['Unknown brand'], price: ['Invalid number'], stock: ['Out of range'] })
})

it('ignores malformed and unrelated error fields', () => {
  expect(readProductValidation(null)).toEqual({})
  expect(readProductValidation({ errors: { Name: 'wrong shape', Price: [42], unrelated: ['Other'] } })).toEqual({})
})
