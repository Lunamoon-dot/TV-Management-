import { z } from 'zod'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { getBrands, type BrandResponse } from '../api/brands'
import { readProductValidation, type ProductFieldErrors } from '../api/product-validation'
import { createProductSchema, type CreateProductForm, type CreateProductRequest } from '../schemas/create-product'
import { getHttpResponseData, isAuthenticationError, isAuthorizationError, isNotFoundError, isValidationError } from '../../../shared/api/errors'
import { useAuthStore } from '../../auth/stores/auth-store'

const inputClass = 'mt-2 w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-2 focus-visible:outline-2 focus-visible:outline-[#254c40]'

interface ProductFormProps {
  initialValues: CreateProductForm
  submitLabel: string
  failureMessage: string
  onSubmit: (request: CreateProductRequest) => Promise<void>
}

export function ProductForm({ initialValues, submitLabel, failureMessage, onSubmit }: ProductFormProps) {
  const [brands, setBrands] = useState<BrandResponse[]>([])
  const [brandStatus, setBrandStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [brandRetry, setBrandRetry] = useState(0)
  const [form, setForm] = useState<CreateProductForm>(initialValues)
  const [errors, setErrors] = useState<ProductFieldErrors>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const markAnonymous = useAuthStore(state => state.markAnonymous)

  useEffect(() => {
    const controller = new AbortController()
    getBrands(controller.signal).then(items => {
      if (controller.signal.aborted) return
      setBrands(items)
      setBrandStatus('success')
    }).catch(() => {
      if (!controller.signal.aborted) setBrandStatus('error')
    })
    return () => controller.abort()
  }, [brandRetry])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || brandStatus !== 'success' || brands.length === 0) return
    const parsed = createProductSchema.safeParse(form)
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors)
      setMessage('Dữ liệu chưa hợp lệ. Hãy kiểm tra các ô nhập.')
      return
    }
    inFlight.current = true
    setSubmitting(true)
    setErrors({})
    setMessage('')
    try {
      await onSubmit(parsed.data)
    } catch (error: unknown) {
      if (isValidationError(error)) {
        setErrors(readProductValidation(getHttpResponseData(error)))
        setMessage('Dữ liệu chưa hợp lệ. Hãy kiểm tra các ô nhập.')
      } else if (isAuthenticationError(error)) {
        markAnonymous()
        navigate('/login', { replace: true, state: { from: location.pathname, expired: true } })
      } else if (isNotFoundError(error)) {
        setMessage('Sản phẩm không còn tồn tại. Hãy quay lại danh sách.')
      } else if (isAuthorizationError(error)) {
        setMessage('Tài khoản không có quyền quản lý TV.')
      } else {
        setMessage(failureMessage)
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return <>
    {brandStatus === 'loading' && <p className="mt-5" role="status">Đang tải hãng TV…</p>}
    {brandStatus === 'error' && <p className="mt-5" role="alert">Không tải được hãng TV.{' '}
      <button type="button" className="cursor-pointer underline" onClick={() => {
        setBrandStatus('loading')
        setBrandRetry(value => value + 1)
      }}>Thử lại</button>
    </p>}
    {brandStatus === 'success' && brands.length === 0 && <p className="mt-5">Cần có hãng TV trước khi lưu sản phẩm.</p>}
    <form className="mt-7" noValidate onSubmit={handleSubmit}>
      <fieldset disabled={submitting || brandStatus !== 'success' || brands.length === 0} className="space-y-5 disabled:opacity-60">
        <div>
          <label htmlFor="name" className="font-medium">Tên TV</label>
          <input id="name" required value={form.name} className={inputClass}
            aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-errors' : undefined}
            onChange={event => setForm({ ...form, name: event.target.value })} />
          <FieldErrors id="name-errors" messages={errors.name} />
        </div>
        <div>
          <label htmlFor="brandId" className="font-medium">Hãng</label>
          <select id="brandId" required value={form.brandId} className={inputClass}
            aria-invalid={Boolean(errors.brandId)} aria-describedby={errors.brandId ? 'brandId-errors' : undefined}
            onChange={event => setForm({ ...form, brandId: event.target.value })}>
            <option value="">Chọn hãng TV</option>
            {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
          <FieldErrors id="brandId-errors" messages={errors.brandId} />
        </div>
        <div>
          <label htmlFor="price" className="font-medium">Giá (VND)</label>
          <input id="price" type="number" required min="0.01" step="0.01" value={form.price} className={inputClass}
            aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? 'price-errors' : undefined}
            onChange={event => setForm({ ...form, price: event.target.value })} />
          <FieldErrors id="price-errors" messages={errors.price} />
        </div>
        <div>
          <label htmlFor="stock" className="font-medium">Số lượng tồn kho</label>
          <input id="stock" type="number" required min="0" max="2147483647" step="1" value={form.stock} className={inputClass}
            aria-invalid={Boolean(errors.stock)} aria-describedby={errors.stock ? 'stock-errors' : undefined}
            onChange={event => setForm({ ...form, stock: event.target.value })} />
          <FieldErrors id="stock-errors" messages={errors.stock} />
        </div>
        <button type="submit" className="cursor-pointer rounded-md bg-[#254c40] px-6 py-3 text-white disabled:cursor-wait">
          {submitting ? 'Đang lưu…' : submitLabel}
        </button>
      </fieldset>
      {message && <p role="alert" className="mt-5 rounded-md bg-orange-50 p-4 text-orange-900">{message}</p>}
    </form>
  </>
}

function FieldErrors({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null
  return <p id={id} className="mt-2 text-sm text-red-800">{messages.join(' ')}</p>
}

