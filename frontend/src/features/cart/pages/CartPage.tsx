import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '../../auth/stores/auth-store'
import { createOrder } from '../../orders/api/orders'
import { checkoutSchema, type CheckoutFormInput } from '../../orders/schemas/checkout'
import { isAuthenticationError, isValidationError, withSupportCode } from '../../../shared/api/errors'
import { getCartTotal, useCartStore } from '../stores/cart-store'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

const emptyCheckout: CheckoutFormInput = {
  recipientName: '',
  phoneNumber: '',
  shippingAddress: '',
  paymentMethod: 'CashOnDelivery',
}

export function CartPage() {
  const items = useCartStore(state => state.items)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeProduct = useCartStore(state => state.removeProduct)
  const clear = useCartStore(state => state.clear)
  const session = useAuthStore(state => state.session)
  const markAnonymous = useAuthStore(state => state.markAnonymous)
  const navigate = useNavigate()
  const location = useLocation()
  const inFlight = useRef(false)
  const checkoutId = useRef(crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [checkoutDetails, setCheckoutDetails] = useState(emptyCheckout)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutFormInput, string>>>({})
  const total = getCartTotal(items)

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || items.length === 0) return
    if (session.status !== 'authenticated') {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    const parsed = checkoutSchema.safeParse(checkoutDetails)
    if (!parsed.success) {
      const errors: Partial<Record<keyof CheckoutFormInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CheckoutFormInput
        errors[field] ??= issue.message
      }
      setFieldErrors(errors)
      return
    }

    inFlight.current = true
    setBusy(true)
    setError('')
    setFieldErrors({})
    try {
      const order = await createOrder({
        checkoutId: checkoutId.current,
        ...parsed.data,
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      })
      clear()
      navigate(`/orders/${order.id}`, { replace: true })
    } catch (requestError: unknown) {
      if (isAuthenticationError(requestError)) {
        markAnonymous()
        navigate('/login', { state: { from: location.pathname, expired: true } })
      } else if (isValidationError(requestError)) {
        setError('Đơn hàng không còn hợp lệ. Có thể giá, sản phẩm hoặc tồn kho đã thay đổi; hãy kiểm tra lại giỏ hàng.')
      } else {
        setError(withSupportCode(
          'Chưa tạo được đơn hàng. Giỏ hàng vẫn được giữ nguyên để bạn thử lại.',
          requestError,
        ))
      }
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
    <Link to="/" className="text-[#254c40] underline underline-offset-4">← Tiếp tục mua TV</Link>
    <div className="mt-8 flex flex-col gap-4 border-b border-[#cbd3cd] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">TV STORE / GIỎ HÀNG</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Giỏ hàng của bạn.</h1>
      </div>
      {items.length > 0 && <button type="button" className="cursor-pointer text-[#254c40] underline underline-offset-4" onClick={clear}>Xóa giỏ hàng</button>}
    </div>

    {items.length === 0 ? <p className="mt-8">Giỏ hàng đang trống.</p> :
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map(item => <li key={item.productId} className="rounded-lg border border-[#d9dfda] bg-white p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">{item.brand}</p>
                <h2 className="mt-2 text-xl font-semibold">
                  <Link to={`/products/${item.productId}`} className="underline-offset-4 hover:underline">{item.name}</Link>
                </h2>
                <p className="mt-3 text-[#52645e]">{money.format(item.price)} · Còn {item.stock} sản phẩm</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor={`cart-quantity-${item.productId}`} className="text-sm font-medium">Số lượng</label>
                <input id={`cart-quantity-${item.productId}`} type="number" min="1" max={item.stock} step="1" value={item.quantity}
                  className="w-24 rounded-md border border-[#cbd3cd] bg-white px-3 py-2"
                  onChange={event => updateQuantity(item.productId, Number(event.target.value))} />
                <button type="button" className="cursor-pointer text-red-800 underline" onClick={() => removeProduct(item.productId)}>Xóa</button>
              </div>
            </div>
            <p className="mt-5 font-semibold">Tạm tính: {money.format(item.price * item.quantity)}</p>
          </li>)}
        </ul>
        <form className="h-fit rounded-lg border border-[#d9dfda] bg-white p-6" noValidate onSubmit={event => void checkout(event)}>
          <h2 className="text-xl font-semibold">Tổng đơn tạm tính</h2>
          <p className="mt-5 text-3xl font-bold">{money.format(total)}</p>
          <p className="mt-4 text-sm text-[#52645e]">Giá và tồn kho sẽ được backend kiểm tra lại trước khi tạo đơn.</p>

          <label className="mt-6 block text-sm font-semibold" htmlFor="recipientName">Tên người nhận</label>
          <input id="recipientName" value={checkoutDetails.recipientName}
            onChange={event => setCheckoutDetails(current => ({ ...current, recipientName: event.target.value }))}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] px-3 py-2" />
          {fieldErrors.recipientName && <p className="mt-1 text-sm text-red-800">{fieldErrors.recipientName}</p>}

          <label className="mt-4 block text-sm font-semibold" htmlFor="phoneNumber">Số điện thoại</label>
          <input id="phoneNumber" type="tel" value={checkoutDetails.phoneNumber}
            onChange={event => setCheckoutDetails(current => ({ ...current, phoneNumber: event.target.value }))}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] px-3 py-2" />
          {fieldErrors.phoneNumber && <p className="mt-1 text-sm text-red-800">{fieldErrors.phoneNumber}</p>}

          <label className="mt-4 block text-sm font-semibold" htmlFor="shippingAddress">Địa chỉ giao hàng</label>
          <textarea id="shippingAddress" rows={3} value={checkoutDetails.shippingAddress}
            onChange={event => setCheckoutDetails(current => ({ ...current, shippingAddress: event.target.value }))}
            className="mt-2 w-full resize-y rounded-md border border-[#cbd3cd] px-3 py-2" />
          {fieldErrors.shippingAddress && <p className="mt-1 text-sm text-red-800">{fieldErrors.shippingAddress}</p>}

          <label className="mt-4 block text-sm font-semibold" htmlFor="paymentMethod">Phương thức thanh toán</label>
          <select id="paymentMethod" value={checkoutDetails.paymentMethod}
            onChange={event => setCheckoutDetails(current => ({ ...current, paymentMethod: event.target.value as CheckoutFormInput['paymentMethod'] }))}
            className="mt-2 w-full rounded-md border border-[#cbd3cd] bg-white px-3 py-2">
            <option value="CashOnDelivery">Thanh toán khi nhận hàng</option>
            <option value="BankTransfer">Chuyển khoản ngân hàng</option>
          </select>
          {checkoutDetails.paymentMethod === 'BankTransfer' && <p className="mt-2 text-sm text-[#52645e]">Thông tin chuyển khoản sẽ được bổ sung ở bài thanh toán tiếp theo.</p>}

          <button type="submit" disabled={busy || session.status === 'loading'}
            className="mt-6 w-full cursor-pointer rounded-md bg-[#254c40] px-6 py-3 text-white disabled:cursor-wait disabled:opacity-60">
            {busy ? 'Đang đặt hàng…' : session.status === 'authenticated' ? 'Đặt hàng' : 'Đăng nhập để đặt hàng'}
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
        </form>
      </div>}
  </main>
}
