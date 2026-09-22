import { z } from 'zod'

export const checkoutSchema = z.object({
  recipientName: z.string().trim()
    .min(2, 'Tên người nhận cần ít nhất 2 ký tự.')
    .max(100, 'Tên người nhận tối đa 100 ký tự.'),
  phoneNumber: z.string().trim()
    .min(8, 'Số điện thoại cần ít nhất 8 ký tự.')
    .max(20, 'Số điện thoại tối đa 20 ký tự.')
    .regex(/^[0-9+\s().-]+$/, 'Số điện thoại chứa ký tự không hợp lệ.'),
  shippingAddress: z.string().trim()
    .min(10, 'Địa chỉ giao hàng cần ít nhất 10 ký tự.')
    .max(300, 'Địa chỉ giao hàng tối đa 300 ký tự.'),
})

export type CheckoutFormInput = z.input<typeof checkoutSchema>
