import type { CreateProductRequest } from '../types'

export type ProductFieldErrors = Partial<Record<keyof CreateProductRequest, string[]>>

export function readProductValidation(data: unknown): ProductFieldErrors {
  if (!data || typeof data !== 'object' || !('errors' in data)) return {}
  const errors = data.errors
  if (!errors || typeof errors !== 'object') return {}
  const fields = ['name', 'brandId', 'price', 'stock'] as const
  const result: ProductFieldErrors = {}
  for (const [key, messages] of Object.entries(errors)) {
    const field = fields.find(name => name.toLowerCase() === key.replace(/^\$\./, '').toLowerCase())
    if (field && Array.isArray(messages) && messages.every(message => typeof message === 'string')) {
      result[field] = messages
    }
  }
  return result
}
