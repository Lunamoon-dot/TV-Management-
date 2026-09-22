import type { CurrentUser } from './types'

export function isAdmin(user: CurrentUser | undefined): boolean {
  return user?.roles.includes('Admin') ?? false
}
