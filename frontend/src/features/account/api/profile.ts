import { getCsrfHeaders } from '../../../shared/api/csrf'
import { http } from '../../../shared/api/http'
import type { CustomerProfile } from '../types'
import type { UpdateProfileRequest } from '../schemas/profile'

export async function getProfile(signal?: AbortSignal): Promise<CustomerProfile> {
  return (await http.get<CustomerProfile>('/account/profile', { signal })).data
}

export async function updateProfile(request: UpdateProfileRequest): Promise<CustomerProfile> {
  return (await http.put<CustomerProfile>('/account/profile', request, {
    headers: await getCsrfHeaders(),
  })).data
}

