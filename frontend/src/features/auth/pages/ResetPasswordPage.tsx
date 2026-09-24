import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { resetPassword } from '../api/auth'
import { resetPasswordSchema, type ResetPasswordFormInput } from '../schemas/password-recovery'
import { getHttpStatus, isValidationError, withSupportCode } from '../../../shared/api/errors'

type PasswordField = 'newPassword' | 'confirmNewPassword'
type FieldErrors = Partial<Record<PasswordField, string[]>>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [credentials] = useState(() => ({
    email: searchParams.get('email') ?? '',
    resetCode: searchParams.get('code') ?? '',
  }))
  const [form, setForm] = useState<Pick<ResetPasswordFormInput, PasswordField>>({
    newPassword: '',
    confirmNewPassword: '',
  })
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({ newPassword: false, confirmNewPassword: false })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [complete, setComplete] = useState(false)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const validLink = credentials.email.length > 0 && credentials.resetCode.length > 0

  useEffect(() => {
    if (window.location.search) window.history.replaceState(window.history.state, '', '/reset-password')
  }, [])

  function passwordField(name: PasswordField, label: string) {
    return <div>
      <label htmlFor={name} className="font-medium">{label}</label>
      <div className="relative mt-2">
        <input id={name} type={visible[name] ? 'text' : 'password'} autoComplete="new-password"
          value={form[name]} aria-invalid={Boolean(fieldErrors[name])}
          onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))}
          className="w-full rounded-md border border-[#cbd3cd] bg-white py-3 pr-20 pl-4" />
        <button type="button" aria-label={`${visible[name] ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} aria-pressed={visible[name]}
          onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}
          className="absolute inset-y-0 right-0 cursor-pointer px-4 text-sm font-medium text-[#254c40]">
          {visible[name] ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
      {fieldErrors[name] && <p className="mt-2 text-sm text-red-800">{fieldErrors[name]?.join(' ')}</p>}
    </div>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    setFieldErrors({})
    setMessage('')
    const parsed = resetPasswordSchema.safeParse({ ...credentials, ...form })
    if (!parsed.success) {
      const errors: FieldErrors = {}
      let linkError = false
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'newPassword' || field === 'confirmNewPassword') {
          errors[field] ??= []
          errors[field]?.push(issue.message)
        }
        if (field === 'email' || field === 'resetCode') linkError = true
      }
      setFieldErrors(errors)
      if (linkError) setMessage('Liên kết đặt lại mật khẩu không hợp lệ.')
      return
    }

    inFlight.current = true
    setBusy(true)
    try {
      await resetPassword(parsed.data)
      setForm({ newPassword: '', confirmNewPassword: '' })
      setComplete(true)
    } catch (error: unknown) {
      if (getHttpStatus(error) === 429) setMessage('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.')
      else if (isValidationError(error)) setMessage('Liên kết đã hết hạn, đã được sử dụng hoặc mật khẩu mới chưa hợp lệ.')
      else setMessage(withSupportCode('Không đặt lại được mật khẩu. Hãy thử lại.', error))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return <main className="mx-auto max-w-lg px-6 py-12">
    <h1 className="text-3xl font-bold">Đặt lại mật khẩu</h1>
    {!validLink ? <p role="alert" className="mt-6 text-red-800">Liên kết đặt lại mật khẩu không hợp lệ. <Link to="/forgot-password" className="underline">Yêu cầu liên kết mới</Link>.</p>
      : complete ? <>
        <p role="status" className="mt-6 text-[#254c40]">Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.</p>
        <p className="mt-6"><Link to="/login" className="underline">Đăng nhập</Link></p>
      </> : <form noValidate onSubmit={submit} className="mt-8">
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          {passwordField('newPassword', 'Mật khẩu mới')}
          {passwordField('confirmNewPassword', 'Nhập lại mật khẩu mới')}
          <p className="text-sm text-[#52645e]">8–128 ký tự, gồm ít nhất một chữ thường và một chữ số.</p>
          <button type="submit" className="w-full cursor-pointer rounded-md bg-[#254c40] px-6 py-3 text-white disabled:cursor-wait">
            {busy ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}
          </button>
        </fieldset>
        {message && <p role="alert" className="mt-5 text-red-800">{message}</p>}
      </form>}
  </main>
}
