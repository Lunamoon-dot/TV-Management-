import { getCsrfHeaders } from '../../../shared/api/csrf'
import { http } from '../../../shared/api/http'
import type { ChangePasswordRequest } from '../schemas/change-password'

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await http.put('/account/password', request, {
    headers: await getCsrfHeaders(),
  })
}

