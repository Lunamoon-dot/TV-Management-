import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, 'Đánh giá cần ít nhất 5 ký tự.').max(1000, 'Đánh giá tối đa 1000 ký tự.'),
})
