import { z } from 'zod'

export const cancelOrderSchema = z.object({
  reason: z.string().trim()
    .min(5, 'Lý do hủy cần ít nhất 5 ký tự.')
    .max(300, 'Lý do hủy tối đa 300 ký tự.'),
})

export type CancelOrderInput = z.input<typeof cancelOrderSchema>
