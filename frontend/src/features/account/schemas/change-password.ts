import { z } from 'zod'

const newPasswordSchema = z.string()
  .min(8, 'Mật khẩu mới cần ít nhất 8 ký tự.')
  .max(128, 'Mật khẩu mới tối đa 128 ký tự.')
  .regex(/[a-z]/, 'Mật khẩu mới cần ít nhất một chữ thường.')
  .regex(/[0-9]/, 'Mật khẩu mới cần ít nhất một chữ số.')

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Vui lòng nhập mật khẩu hiện tại.')
    .max(128, 'Mật khẩu hiện tại tối đa 128 ký tự.'),
  newPassword: newPasswordSchema,
  confirmNewPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Mật khẩu nhập lại không khớp.',
  path: ['confirmNewPassword'],
}).transform(data => ({
  currentPassword: data.currentPassword,
  newPassword: data.newPassword,
}))

export type ChangePasswordFormInput = z.input<typeof changePasswordSchema>
export type ChangePasswordRequest = z.output<typeof changePasswordSchema>

