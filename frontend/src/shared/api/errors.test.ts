import { describe, expect, it } from 'vitest'
import { getCorrelationId, withSupportCode } from './errors'

function axiosError(correlationId?: string): unknown {
  return {
    isAxiosError: true,
    response: {
      headers: correlationId ? { 'x-correlation-id': correlationId } : {},
    },
  }
}

describe('API support codes', () => {
  it('reads the correlation ID from an Axios response', () => {
    expect(getCorrelationId(axiosError('request-123'))).toBe('request-123')
  })

  it('appends the support code when the server returned one', () => {
    expect(withSupportCode('Không thể xử lý.', axiosError('request-123')))
      .toBe('Không thể xử lý. Mã hỗ trợ: request-123.')
  })

  it('keeps the original message for network and non-Axios errors', () => {
    expect(withSupportCode('Không thể xử lý.', axiosError())).toBe('Không thể xử lý.')
    expect(withSupportCode('Không thể xử lý.', new Error('offline'))).toBe('Không thể xử lý.')
  })
})
