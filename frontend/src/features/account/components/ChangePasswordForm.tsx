import { useRef, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { changePassword } from '../api/password'
import { changePasswordSchema, type ChangePasswordFormInput } from '../schemas/change-password'
import { getHttpResponseData, isAuthenticationError, isValidationError, withSupportCode } from '../../../shared/api/errors'
import { useAuthStore } from '../../auth/stores/auth-store'
import { useNavigate } from 'react-router'

type FieldErrors = Partial<Record<keyof ChangePasswordFormInput, string[]>>
type PasswordFieldName = keyof ChangePasswordFormInput

const emptyForm: ChangePasswordFormInput = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
}

const validationProblem = z.object({
  errors: z.record(z.string(), z.array(z.string())),
})

export function ChangePasswordForm() {
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [visible, setVisible] = useState<Record<PasswordFieldName, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)
  const markAnonymous = useAuthStore(state => state.markAnonymous)
  const navigate = useNavigate()

  function passwordField(name: PasswordFieldName, label: string, autoComplete: string) {
    const errorId = `${name}-errors`
    return <div>
      <label htmlFor={name} className="font-medium">{label}</label>
      <div className="relative mt-2">
        <input id={name} type={visible[name] ? 'text' : 'password'} autoComplete={autoComplete}
          value={form[name]} aria-invalid={Boolean(fieldErrors[name])}
          aria-describedby={fieldErrors[name] ? errorId : undefined}
          onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))}
          className="w-full rounded-md border border-[#cbd3cd] py-3 pr-20 pl-4" />
        <button type="button" aria-label={`${visible[name] ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
          aria-pressed={visible[name]}
          className="absolute inset-y-0 right-0 cursor-pointer px-4 text-sm font-medium text-[#254c40]"
          onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}>
          {visible[name] ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
      {fieldErrors[name] && <p id={errorId} className="mt-2 text-sm text-red-800">{fieldErrors[name]?.join(' ')}</p>}
    </div>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    setFieldErrors({})
    setMessage('')
    const parsed = changePasswordSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors)
      return
    }

    inFlight.current = true
    setSaving(true)
    try {
      await changePassword(parsed.data)
      setForm(emptyForm)
      setVisible({ currentPassword: false, newPassword: false, confirmNewPassword: false })
      setMessage('Đã đổi mật khẩu.')
    } catch (error: unknown) {
      if (isAuthenticationError(error)) {
        markAnonymous()
        navigate('/login', { replace: true, state: { from: '/account/profile', expired: true } })
      } else if (isValidationError(error)) {
        const problem = validationProblem.safeParse(getHttpResponseData(error))
        const errors: FieldErrors = {}
        if (problem.success) {
          for (const field of Object.keys(problem.data.errors)) {
            if (field.toLowerCase() === 'currentpassword') errors.currentPassword = ['Mật khẩu hiện tại không đúng.']
            if (field.toLowerCase() === 'newpassword') errors.newPassword = ['Mật khẩu mới chưa đáp ứng yêu cầu.']
          }
        }
        setFieldErrors(errors)
        setMessage('Không thể đổi mật khẩu. Hãy kiểm tra lại thông tin.')
      } else {
        setMessage(withSupportCode('Không đổi được mật khẩu. Hãy thử lại.', error))
      }
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return <section className="mt-10 border-t border-[#cbd3cd] pt-10">
    <h2 className="text-2xl font-bold">Đổi mật khẩu</h2>
    <p className="mt-3 text-[#52645e]">Mật khẩu mới cần ít nhất 8 ký tự, một chữ thường và một chữ số.</p>
    <form noValidate onSubmit={submit} className="mt-6 rounded-lg border border-[#cbd3cd] bg-white p-6 sm:p-8">
      <fieldset disabled={saving} className="space-y-5 disabled:opacity-60">
        {passwordField('currentPassword', 'Mật khẩu hiện tại', 'current-password')}
        {passwordField('newPassword', 'Mật khẩu mới', 'new-password')}
        {passwordField('confirmNewPassword', 'Nhập lại mật khẩu mới', 'new-password')}
        <button type="submit" className="cursor-pointer rounded-md bg-[#254c40] px-6 py-3 font-medium text-white disabled:cursor-wait">
          {saving ? 'Đang đổi…' : 'Đổi mật khẩu'}
        </button>
      </fieldset>
      {message && <p role="status" className={`mt-5 ${message === 'Đã đổi mật khẩu.' ? 'text-[#254c40]' : 'text-red-800'}`}>{message}</p>}
    </form>
  </section>
}

