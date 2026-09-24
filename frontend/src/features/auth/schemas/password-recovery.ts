import { z } from 'zod'

const emailSchema = z.string().trim()
  .email('Email không hợp lệ.')
  .max(256, 'Email quá dài.')

const newPasswordSchema = z.string()
  .min(8, 'Mật khẩu mới cần ít nhất 8 ký tự.')
  .max(128, 'Mật khẩu mới tối đa 128 ký tự.')
  .regex(/[a-z]/, 'Mật khẩu mới cần ít nhất một chữ thường.')
  .regex(/[0-9]/, 'Mật khẩu mới cần ít nhất một chữ số.')

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z.object({
  email: emailSchema,
  resetCode: z.string().min(1, 'Liên kết đặt lại mật khẩu không hợp lệ.').max(4096),
  newPassword: newPasswordSchema,
  confirmNewPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Mật khẩu nhập lại không khớp.',
  path: ['confirmNewPassword'],
}).transform(data => ({
  email: data.email,
  resetCode: data.resetCode,
  newPassword: data.newPassword,
}))

export type ForgotPasswordRequest = z.output<typeof forgotPasswordSchema>
export type ResetPasswordFormInput = z.input<typeof resetPasswordSchema>
export type ResetPasswordRequest = z.output<typeof resetPasswordSchema>

