import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { z } from 'zod'
import { forgotPassword } from '../api/auth'
import { forgotPasswordSchema } from '../schemas/password-recovery'
import { getHttpStatus, withSupportCode } from '../../../shared/api/errors'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailErrors, setEmailErrors] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    setEmailErrors([])
    setMessage('')
    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setEmailErrors(z.flattenError(parsed.error).fieldErrors.email ?? [])
      return
    }

    inFlight.current = true
    setBusy(true)
    try {
      await forgotPassword(parsed.data)
      setSent(true)
    } catch (error: unknown) {
      if (getHttpStatus(error) === 429) {
        setMessage('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.')
      } else {
        setMessage(withSupportCode('Không gửi được yêu cầu. Hãy thử lại.', error))
      }
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return <main className="mx-auto max-w-lg px-6 py-12">
    <h1 className="text-3xl font-bold">Quên mật khẩu</h1>
    {sent ? <>
      <p role="status" className="mt-6 text-[#254c40]">Nếu email thuộc một tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.</p>
      <p className="mt-6"><Link to="/login" className="underline">Quay lại đăng nhập</Link></p>
    </> : <form noValidate onSubmit={submit} className="mt-8">
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <div>
          <label htmlFor="recovery-email" className="font-medium">Email</label>
          <input id="recovery-email" type="email" autoComplete="email" value={email}
            aria-invalid={emailErrors.length > 0}
            onChange={event => setEmail(event.target.value)}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-3" />
          {emailErrors.length > 0 && <p className="mt-2 text-sm text-red-800">{emailErrors.join(' ')}</p>}
        </div>
        <button type="submit" className="w-full cursor-pointer rounded-md bg-[#254c40] px-6 py-3 text-white disabled:cursor-wait">
          {busy ? 'Đang gửi…' : 'Gửi hướng dẫn'}
        </button>
      </fieldset>
      {message && <p role="alert" className="mt-5 text-red-800">{message}</p>}
      <p className="mt-6"><Link to="/login" className="underline">Quay lại đăng nhập</Link></p>
    </form>}
  </main>
}

