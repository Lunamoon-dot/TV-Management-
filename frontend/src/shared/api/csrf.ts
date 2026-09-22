import { http } from './http'

export async function getCsrfHeaders() {
  const response = await http.get<{ token: string }>('/auth/csrf')
  return { 'X-CSRF-TOKEN': response.data.token }
}
