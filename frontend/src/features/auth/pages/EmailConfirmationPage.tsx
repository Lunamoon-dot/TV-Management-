import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'
import { confirmEmail, sendConfirmationEmail } from '../api/auth'
import { confirmationCodeSchema, emailConfirmationSchema } from '../schemas/email-confirmation'
import { getHttpStatus, isValidationError, withSupportCode } from '../../../shared/api/errors'

export function EmailConfirmationPage() {
  const [searchParams] = useSearchParams()
  const [credentials] = useState(() => ({
    email: searchParams.get('email') ?? '',
    confirmationCode: searchParams.get('code') ?? '',
  }))
  const [email, setEmail] = useState(credentials.email)
  const [emailError, setEmailError] = useState('')
  const [message, setMessage] = useState('')
  const [complete, setComplete] = useState(false)
  const validLink = confirmationCodeSchema.safeParse(credentials).success
  const invalidLink = Boolean(credentials.confirmationCode) && !validLink
  const [busy, setBusy] = useState(Boolean(credentials.confirmationCode) && validLink)
  const inFlight = useRef(false)

  useEffect(() => {
    if (window.location.search) window.history.replaceState(window.history.state, '', '/confirm-email')
  }, [])

  useEffect(() => {
    if (!credentials.confirmationCode || invalidLink || inFlight.current) return
    inFlight.current = true
    const parsed = confirmationCodeSchema.safeParse(credentials)
    if (!parsed.success) return
    void confirmEmail(parsed.data)
      .then(() => setComplete(true))
      .catch(error => {
        if (isValidationError(error)) setMessage('Liên kết xác nhận đã hết hạn hoặc không hợp lệ.')
        else setMessage(withSupportCode('Không xác nhận được email. Hãy thử lại.', error))
      })
      .finally(() => {
        setBusy(false)
        inFlight.current = false
      })
  }, [credentials, invalidLink])

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    setEmailError('')
    setMessage('')
    const parsed = emailConfirmationSchema.safeParse({ email })
    if (!parsed.success) {
      setEmailError(z.flattenError(parsed.error).fieldErrors.email?.[0] ?? 'Email không hợp lệ.')
      return
    }

    inFlight.current = true
    setBusy(true)
    try {
      await sendConfirmationEmail(parsed.data)
      setMessage('Nếu email thuộc một tài khoản chưa xác nhận, hướng dẫn mới sẽ được gửi tới bạn.')
    } catch (error: unknown) {
      if (getHttpStatus(error) === 429) setMessage('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.')
      else setMessage(withSupportCode('Không gửi lại được email. Hãy thử lại.', error))
    } finally {
      setBusy(false)
      inFlight.current = false
    }
  }

  if (busy) return <main className="mx-auto max-w-lg px-6 py-12" role="status">Đang xác nhận email…</main>
  if (invalidLink) return <main className="mx-auto max-w-lg px-6 py-12"><p role="alert" className="text-red-800">Liên kết xác nhận không hợp lệ. Hãy yêu cầu gửi lại email.</p><p className="mt-6"><Link to="/confirm-email" className="underline">Gửi lại email xác nhận</Link></p></main>

  return <main className="mx-auto max-w-lg px-6 py-12">
    <h1 className="text-3xl font-bold">Xác nhận email</h1>
    {complete ? <>
      <p role="status" className="mt-6 text-[#254c40]">Email đã được xác nhận. Bạn có thể đăng nhập.</p>
      <p className="mt-6"><Link to="/login" className="underline">Đăng nhập</Link></p>
    </> : <>
      <p className="mt-5 text-[#52645e]">Nhập email để nhận lại liên kết xác nhận.</p>
      <form noValidate onSubmit={resend} className="mt-8">
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <div>
            <label htmlFor="confirmation-email" className="font-medium">Email</label>
            <input id="confirmation-email" type="email" autoComplete="email" value={email}
              aria-invalid={Boolean(emailError)} onChange={event => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-3" />
            {emailError && <p className="mt-2 text-sm text-red-800">{emailError}</p>}
          </div>
          <button type="submit" className="w-full cursor-pointer rounded-md bg-[#254c40] px-6 py-3 text-white disabled:cursor-wait">
            {busy ? 'Đang gửi…' : 'Gửi lại email xác nhận'}
          </button>
        </fieldset>
        {message && <p role="status" className="mt-5 text-[#254c40]">{message}</p>}
      </form>
      <p className="mt-6"><Link to="/login" className="underline">Quay lại đăng nhập</Link></p>
    </>}
  </main>
}
