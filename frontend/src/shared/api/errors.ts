import axios from 'axios'

export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

export function getHttpResponseData(error: unknown): unknown {
  return axios.isAxiosError(error) ? error.response?.data : undefined
}

export function getCorrelationId(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined

  const value = error.response?.headers['x-correlation-id']
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function withSupportCode(message: string, error: unknown): string {
  const correlationId = getCorrelationId(error)
  return correlationId ? `${message} Mã hỗ trợ: ${correlationId}.` : message
}

export function isValidationError(error: unknown): boolean {
  return getHttpStatus(error) === 400
}

export function isAuthenticationError(error: unknown): boolean {
  return getHttpStatus(error) === 401
}

export function isAuthorizationError(error: unknown): boolean {
  return getHttpStatus(error) === 403
}

export function isNotFoundError(error: unknown): boolean {
  return getHttpStatus(error) === 404
}

export function isConflictError(error: unknown): boolean {
  return getHttpStatus(error) === 409
}
