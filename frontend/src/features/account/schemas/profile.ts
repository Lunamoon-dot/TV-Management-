import { z } from 'zod'

export const profileSchema = z.object({
  fullName: z.string().trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự.')
    .max(100, 'Họ tên không được vượt quá 100 ký tự.'),
  phoneNumber: z.string().trim()
    .min(8, 'Số điện thoại phải có ít nhất 8 ký tự.')
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự.')
    .regex(/^[0-9+\s().-]+$/, 'Số điện thoại chứa ký tự không hợp lệ.'),
  shippingAddress: z.string().trim()
    .min(10, 'Địa chỉ phải có ít nhất 10 ký tự.')
    .max(300, 'Địa chỉ không được vượt quá 300 ký tự.'),
})

export type ProfileForm = z.input<typeof profileSchema>
export type UpdateProfileRequest = z.output<typeof profileSchema>

