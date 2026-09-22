import axios from 'axios'

export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

export function getHttpResponseData(error: unknown): unknown {
  return axios.isAxiosError(error) ? error.response?.data : undefined
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
