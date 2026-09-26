import { http } from '../../../shared/api/http'
import { getCsrfHeaders } from '../../../shared/api/csrf'
import type { AuthRequest } from '../schemas/auth'
import type { CurrentUser } from '../types'
import type { ForgotPasswordRequest, ResetPasswordRequest } from '../schemas/password-recovery'
import type { ConfirmEmailRequest, EmailConfirmationRequest } from '../schemas/email-confirmation'

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

export async function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
  await http.post('/auth/forgot-password', request, { headers: await getCsrfHeaders() })
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
  await http.post('/auth/reset-password', request, { headers: await getCsrfHeaders() })
}

export async function sendConfirmationEmail(request: EmailConfirmationRequest): Promise<void> {
  await http.post('/auth/send-confirmation-email', request, { headers: await getCsrfHeaders() })
}

export async function confirmEmail(request: ConfirmEmailRequest): Promise<void> {
  await http.post('/auth/confirm-email', request, { headers: await getCsrfHeaders() })
}
