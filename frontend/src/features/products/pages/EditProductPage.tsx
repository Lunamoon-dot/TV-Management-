import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getProductById, updateProduct } from '../api/products'
import { ProductForm } from '../components/ProductForm'
import type { ProductResponse } from '../types'
import { isNotFoundError } from '../../../shared/api/errors'

type EditState =
  | { status: 'loading' | 'not-found' | 'error' }
  | { status: 'success'; product: ProductResponse }

export function EditProductPage() {
  const { id } = useParams()
  const productId = Number(id)
  const validId = /^\d+$/.test(id ?? '') && Number.isInteger(productId) && productId > 0 && productId <= 2147483647

  return <main className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
    <Link to="/admin/products" className="text-[#254c40] underline underline-offset-4">← Về danh sách quản lý</Link>
    <h1 className="mt-8 text-3xl font-bold">Sửa TV</h1>
    {validId ? <EditProduct key={productId} id={productId} /> : <p className="mt-5">Địa chỉ sản phẩm không hợp lệ.</p>}
  </main>
}

function EditProduct({ id }: { id: number }) {
  const navigate = useNavigate()
  const [state, setState] = useState<EditState>({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getProductById(id, controller.signal).then(product => {
      if (!controller.signal.aborted) setState({ status: 'success', product })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setState({ status: isNotFoundError(error) ? 'not-found' : 'error' })
    })
    return () => controller.abort()
  }, [id, retry])

  if (state.status === 'loading') return <p className="mt-5" role="status">Đang tải TV để sửa…</p>
  if (state.status === 'not-found') return <p className="mt-5">Không tìm thấy sản phẩm để sửa.</p>
  if (state.status === 'error') return <div className="mt-5" role="alert">
    Không tải được sản phẩm.{' '}
    <button type="button" className="cursor-pointer underline" onClick={() => {
      setState({ status: 'loading' })
      setRetry(value => value + 1)
    }}>Thử lại</button>
  </div>
  if (state.status !== 'success') return null

  const { product } = state
  return <ProductForm
    initialValues={{
      name: product.name,
      imageUrl: product.imageUrl ?? '',
      screenSizeInches: product.screenSizeInches === null ? '' : String(product.screenSizeInches),
      resolution: product.resolution ?? '',
      brandId: String(product.brandId),
      price: String(product.price),
      stock: String(product.stock),
    }}
    submitLabel="Lưu thay đổi"
    failureMessage="Chưa xác nhận được kết quả cập nhật. Hãy kiểm tra trang chi tiết trước khi gửi lại."
    onSubmit={async request => {
      await updateProduct(id, { ...request, rowVersion: product.rowVersion })
      navigate('/admin/products', { replace: true })
    }}
  />
}
