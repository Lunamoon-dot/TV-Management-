import { z } from 'zod'

export const emailConfirmationSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.').max(256, 'Email quá dài.'),
})

export const confirmationCodeSchema = z.object({
  email: emailConfirmationSchema.shape.email,
  confirmationCode: z.string().min(1, 'Liên kết xác nhận không hợp lệ.').max(4096),
})

export type EmailConfirmationRequest = z.output<typeof emailConfirmationSchema>
export type ConfirmEmailRequest = z.output<typeof confirmationCodeSchema>

