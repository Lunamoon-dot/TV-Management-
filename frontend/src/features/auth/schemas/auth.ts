import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.').max(256, 'Email quá dài.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(128, 'Mật khẩu tối đa 128 ký tự.'),
})

export const registerSchema = loginSchema.extend({
  password: loginSchema.shape.password
    .min(12, 'Mật khẩu cần ít nhất 12 ký tự.')
    .regex(/[a-z]/, 'Cần ít nhất một chữ thường.')
    .regex(/[A-Z]/, 'Cần ít nhất một chữ hoa.')
    .regex(/[0-9]/, 'Cần ít nhất một chữ số.')
    .regex(/[^a-zA-Z0-9]/, 'Cần ít nhất một ký tự đặc biệt.'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp.',
  path: ['confirmPassword'],
}).transform(data => ({ email: data.email, password: data.password }))

export type AuthRequest = z.output<typeof loginSchema>
