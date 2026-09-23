import { z } from 'zod'

export const orderNoteSchema = z.object({
  content: z.string().trim()
    .min(3, 'Ghi chú cần ít nhất 3 ký tự.')
    .max(1000, 'Ghi chú tối đa 1000 ký tự.'),
})
