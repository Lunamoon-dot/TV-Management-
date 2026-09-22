import { http } from '../../../shared/api/http'
import { getCsrfHeaders } from '../../../shared/api/csrf'
import type { AuthRequest } from '../schemas/auth'
import type { CurrentUser } from '../types'

export async function register(request: AuthRequest): Promise<void> {
  await http.post('/auth/register', request, { headers: await getCsrfHeaders() })
}

export async function login(request: AuthRequest): Promise<void> {
  await http.post('/auth/login', request, { headers: await getCsrfHeaders() })
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout', {}, { headers: await getCsrfHeaders() })
}

export async function getMe(signal?: AbortSignal): Promise<CurrentUser> {
  return (await http.get<CurrentUser>('/auth/me', { signal })).data
}
