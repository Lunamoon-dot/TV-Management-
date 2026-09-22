import { z } from 'zod'

const requiredNumber = (message: string) => z.string()
  .trim()
  .min(1, message)
  .transform(Number)
  .pipe(z.number({ error: 'Vui lòng nhập số hợp lệ.' }))

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên TV.'),
  imageUrl: z.string().trim()
    .min(1, 'Vui lòng nhập URL ảnh.')
    .max(2048, 'URL ảnh quá dài.')
    .url('URL ảnh không hợp lệ.')
    .refine(value => value.startsWith('http://') || value.startsWith('https://'), 'URL ảnh phải dùng HTTP hoặc HTTPS.'),
  screenSizeInches: requiredNumber('Vui lòng nhập kích thước màn hình.')
    .pipe(z.number().min(1, 'Kích thước phải từ 1 inch.').max(200, 'Kích thước tối đa 200 inch.')
      .multipleOf(0.1, 'Kích thước chỉ được có tối đa 1 chữ số thập phân.')),
  resolution: z.string().trim().min(1, 'Vui lòng nhập độ phân giải.').max(50, 'Độ phân giải tối đa 50 ký tự.'),
  brandId: requiredNumber('Vui lòng chọn hãng TV.')
    .pipe(z.number().int('Hãng TV không hợp lệ.').min(1, 'Vui lòng chọn hãng TV.').max(2147483647, 'Hãng TV không hợp lệ.')),
  price: requiredNumber('Vui lòng nhập giá.')
    .pipe(z.number().min(0.01, 'Giá phải từ 0.01 trở lên.')
      .lt(1e16, 'Giá vượt giới hạn cho phép.')
      .multipleOf(0.01, 'Giá chỉ được có tối đa 2 chữ số thập phân.')),
  stock: requiredNumber('Vui lòng nhập số lượng tồn kho.')
    .pipe(z.number().int('Tồn kho phải là số nguyên.').min(0, 'Tồn kho không được âm.')
      .max(2147483647, 'Tồn kho vượt giới hạn cho phép.')),
})

export type CreateProductForm = z.input<typeof createProductSchema>
export type CreateProductRequest = z.output<typeof createProductSchema>
