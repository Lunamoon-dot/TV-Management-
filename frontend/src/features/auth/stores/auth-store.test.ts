import { beforeEach, expect, it, vi } from 'vitest'
import { getMe, login, logout } from '../api/auth'
import { useAuthStore } from './auth-store'

vi.mock('../api/auth', () => ({ getMe: vi.fn(), login: vi.fn(), logout: vi.fn() }))
const user = { id: 'test-user', email: 'user@example.test', roles: [] }
beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.setState({ session: { status: 'loading' } })
})

it('restores a session through me and distinguishes 401 from network failure', async () => {
  vi.mocked(getMe).mockResolvedValueOnce(user)
  await useAuthStore.getState().refresh()
  expect(useAuthStore.getState().session).toEqual({ status: 'authenticated', user })
  vi.mocked(getMe).mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } })
  await useAuthStore.getState().refresh()
  expect(useAuthStore.getState().session.status).toBe('anonymous')
  vi.mocked(getMe).mockRejectedValueOnce(new Error('offline'))
  await useAuthStore.getState().refresh()
  expect(useAuthStore.getState().session.status).toBe('error')
})

it('reads me after login and clears state only after successful logout', async () => {
  vi.mocked(login).mockResolvedValue()
  vi.mocked(getMe).mockResolvedValue(user)
  await useAuthStore.getState().signIn({ email: user.email, password: 'test' })
  expect(useAuthStore.getState().session.status).toBe('authenticated')
  vi.mocked(logout).mockRejectedValueOnce(new Error('offline'))
  await expect(useAuthStore.getState().signOut()).rejects.toThrow('offline')
  expect(useAuthStore.getState().session.status).toBe('authenticated')
  vi.mocked(logout).mockResolvedValue()
  await useAuthStore.getState().signOut()
  expect(useAuthStore.getState().session.status).toBe('anonymous')
})

it('does not let a stale me response undo logout', async () => {
  let resolve!: (value: typeof user) => void
  vi.mocked(getMe).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  const pending = useAuthStore.getState().refresh()
  vi.mocked(logout).mockResolvedValue()
  await useAuthStore.getState().signOut()
  resolve(user)
  await pending
  expect(useAuthStore.getState().session.status).toBe('anonymous')
})
