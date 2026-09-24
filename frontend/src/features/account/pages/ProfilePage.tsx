import { useEffect, useRef, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { getProfile, updateProfile } from '../api/profile'
import { profileSchema, type ProfileForm } from '../schemas/profile'
import { isAuthenticationError, isValidationError, withSupportCode } from '../../../shared/api/errors'
import { useAuthStore } from '../../auth/stores/auth-store'
import { useNavigate } from 'react-router'
import { ChangePasswordForm } from '../components/ChangePasswordForm'

type FieldErrors = Partial<Record<keyof ProfileForm, string[]>>
const emptyForm: ProfileForm = { fullName: '', phoneNumber: '', shippingAddress: '' }

export function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const submitInFlight = useRef(false)
  const markAnonymous = useAuthStore(state => state.markAnonymous)
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    getProfile(controller.signal)
      .then(profile => {
        setEmail(profile.email)
        setForm({
          fullName: profile.fullName ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          shippingAddress: profile.shippingAddress ?? '',
        })
        setLoadError('')
      })
      .catch(error => {
        if (controller.signal.aborted) return
        if (isAuthenticationError(error)) {
          markAnonymous()
          navigate('/login', { replace: true, state: { from: '/account/profile', expired: true } })
          return
        }
        setLoadError(withSupportCode('Không tải được hồ sơ. Hãy thử lại.', error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [markAnonymous, navigate])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitInFlight.current) return
    setFieldErrors({})
    setMessage('')
    const parsed = profileSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors)
      return
    }

    submitInFlight.current = true
    setSaving(true)
    try {
      const profile = await updateProfile(parsed.data)
      setForm({
        fullName: profile.fullName ?? '',
        phoneNumber: profile.phoneNumber ?? '',
        shippingAddress: profile.shippingAddress ?? '',
      })
      setMessage('Đã lưu hồ sơ.')
    } catch (error: unknown) {
      if (isAuthenticationError(error)) {
        markAnonymous()
        navigate('/login', { replace: true, state: { from: '/account/profile', expired: true } })
      } else if (isValidationError(error)) {
        setMessage('Dữ liệu chưa hợp lệ. Hãy kiểm tra lại các trường.')
      } else {
        setMessage(withSupportCode('Không lưu được hồ sơ. Hãy thử lại.', error))
      }
    } finally {
      submitInFlight.current = false
      setSaving(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-12" role="status">Đang tải hồ sơ…</main>
  if (loadError) return <main className="mx-auto max-w-3xl px-6 py-12"><p role="alert" className="text-red-800">{loadError}</p></main>

  return <main className="mx-auto max-w-3xl px-6 py-12">
    <p className="text-sm font-bold tracking-[0.18em] text-[#35675a]">TÀI KHOẢN / HỒ SƠ</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Thông tin giao hàng.</h1>
    <p className="mt-4 text-[#52645e]">Thông tin này sẽ được dùng làm mặc định khi bạn đặt TV.</p>

    <form noValidate onSubmit={submit} className="mt-10 rounded-lg border border-[#cbd3cd] bg-white p-6 sm:p-8">
      <fieldset disabled={saving} className="space-y-5 disabled:opacity-60">
        <div>
          <label htmlFor="profile-email" className="font-medium">Email</label>
          <input id="profile-email" value={email} readOnly className="mt-2 w-full rounded-md border border-[#cbd3cd] bg-[#f0f1ed] px-4 py-3 text-[#52645e]" />
          <p className="mt-2 text-sm text-[#52645e]">Email đăng nhập không sửa tại đây.</p>
        </div>
        <div>
          <label htmlFor="profile-name" className="font-medium">Họ và tên</label>
          <input id="profile-name" autoComplete="name" value={form.fullName}
            aria-invalid={Boolean(fieldErrors.fullName)}
            onChange={event => setForm({ ...form, fullName: event.target.value })}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] px-4 py-3" />
          {fieldErrors.fullName && <p className="mt-2 text-sm text-red-800">{fieldErrors.fullName.join(' ')}</p>}
        </div>
        <div>
          <label htmlFor="profile-phone" className="font-medium">Số điện thoại</label>
          <input id="profile-phone" type="tel" autoComplete="tel" value={form.phoneNumber}
            aria-invalid={Boolean(fieldErrors.phoneNumber)}
            onChange={event => setForm({ ...form, phoneNumber: event.target.value })}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] px-4 py-3" />
          {fieldErrors.phoneNumber && <p className="mt-2 text-sm text-red-800">{fieldErrors.phoneNumber.join(' ')}</p>}
        </div>
        <div>
          <label htmlFor="profile-address" className="font-medium">Địa chỉ giao hàng mặc định</label>
          <textarea id="profile-address" autoComplete="street-address" rows={4} value={form.shippingAddress}
            aria-invalid={Boolean(fieldErrors.shippingAddress)}
            onChange={event => setForm({ ...form, shippingAddress: event.target.value })}
            className="mt-2 w-full resize-y rounded-md border border-[#cbd3cd] px-4 py-3" />
          {fieldErrors.shippingAddress && <p className="mt-2 text-sm text-red-800">{fieldErrors.shippingAddress.join(' ')}</p>}
        </div>
        <button type="submit" className="cursor-pointer rounded-md bg-[#254c40] px-6 py-3 font-medium text-white disabled:cursor-wait">
          {saving ? 'Đang lưu…' : 'Lưu hồ sơ'}
        </button>
      </fieldset>
      {message && <p role="status" className={`mt-5 ${message === 'Đã lưu hồ sơ.' ? 'text-[#254c40]' : 'text-red-800'}`}>{message}</p>}
    </form>
    <ChangePasswordForm />
  </main>
}
