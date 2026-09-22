import axios from 'axios'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, type Location } from 'react-router'
import { z } from 'zod'
import { register } from '../api/auth'
import { loginSchema, registerSchema } from '../schemas/auth'
import { useAuthStore } from '../stores/auth-store'

type FieldErrors = { email?: string[]; password?: string[]; confirmPassword?: string[] }
const serverErrors = z.object({ errors: z.record(z.string(), z.array(z.string())) })

function getReturnPath(location: Location): string {
  const from = location.state?.from
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('/login')) return '/'
  return from
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const signIn = useAuthStore(state => state.signIn)
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    setMessage('')
    setErrors({})
    const parsed = (isRegister ? registerSchema : loginSchema).safeParse(form)
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors)
      return
    }
    inFlight.current = true
    setBusy(true)
    try {
      if (isRegister) {
        await register(parsed.data)
        navigate('/login', { replace: true, state: { registered: true } })
      } else {
        await signIn(parsed.data)
        navigate(getReturnPath(location), { replace: true })
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const parsedErrors = serverErrors.safeParse(error.response.data)
        if (parsedErrors.success) {
          const mapped: FieldErrors = {}
          for (const [field, messages] of Object.entries(parsedErrors.data.errors)) {
            if (field.toLowerCase() === 'email') mapped.email = messages
            if (field.toLowerCase() === 'password') mapped.password = messages
          }
          setErrors(mapped)
        }
        setMessage('Yêu cầu chưa hợp lệ. Kiểm tra dữ liệu hoặc thử gửi lại để lấy mã CSRF mới.')
      } else if (axios.isAxiosError(error) && error.response?.status === 401) {
        setMessage('Không thể đăng nhập với thông tin đã cung cấp.')
      } else {
        setMessage(isRegister ? 'Chưa xác nhận được đăng ký. Nếu đã tạo tài khoản, hãy thử đăng nhập.' : 'Không kiểm tra được đăng nhập. Hãy thử lại khi API hoạt động.')
      }
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return <main className="mx-auto max-w-lg px-6 py-12">
    <h1 className="text-3xl font-bold">{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
    {!isRegister && location.state?.registered === true && <p role="status" className="mt-4 text-[#254c40]">Đã tạo tài khoản. Bạn có thể đăng nhập.</p>}
    {!isRegister && location.state?.expired === true && <p role="status" className="mt-4 text-[#254c40]">Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.</p>}
    <form noValidate onSubmit={submit} className="mt-8">
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <div>
          <label htmlFor="auth-email" className="font-medium">Email</label>
          <input id="auth-email" type="email" autoComplete="username" required value={form.email}
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-errors' : undefined}
            onChange={event => setForm({ ...form, email: event.target.value })}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-3" />
          {errors.email && <p id="email-errors" className="mt-2 text-sm text-red-800">{errors.email.join(' ')}</p>}
        </div>
        <div>
          <label htmlFor="auth-password" className="font-medium">Mật khẩu</label>
          <input id="auth-password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required value={form.password}
            aria-invalid={Boolean(errors.password)} aria-describedby="password-help password-errors"
            onChange={event => setForm({ ...form, password: event.target.value })}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-3" />
          <p id="password-help" className="mt-2 text-sm text-[#52645e]">{isRegister ? '12–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' : 'Nhập mật khẩu của tài khoản đã đăng ký.'}</p>
          <p id="password-errors" className="mt-2 text-sm text-red-800">{errors.password?.join(' ')}</p>
        </div>
        {isRegister && <div>
          <label htmlFor="auth-confirm-password" className="font-medium">Nhập lại mật khẩu</label>
          <input id="auth-confirm-password" type="password" autoComplete="new-password" required value={form.confirmPassword}
            aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirm-password-errors' : undefined}
            onChange={event => setForm({ ...form, confirmPassword: event.target.value })}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-3" />
          {errors.confirmPassword && <p id="confirm-password-errors" className="mt-2 text-sm text-red-800">{errors.confirmPassword.join(' ')}</p>}
        </div>}
        <button type="submit" className="w-full cursor-pointer rounded-md bg-[#254c40] px-6 py-3 text-white disabled:cursor-wait">
          {busy ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
        </button>
      </fieldset>
      {message && <p role="alert" className="mt-5 text-red-800">{message}</p>}
    </form>
    <p className="mt-6"><Link className="underline" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</Link></p>
  </main>
}
