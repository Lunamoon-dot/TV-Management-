import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getProductById } from '../api/products'
import type { ProductResponse } from '../types'
import { useCartStore } from '../../cart/stores/cart-store'
import { isNotFoundError } from '../../../shared/api/errors'

type DetailsState =
  | { status: 'loading' | 'not-found' | 'error' }
  | { status: 'success'; product: ProductResponse }

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function ProductDetailsPage() {
  const { id } = useParams()
  const productId = Number(id)
  const validId = /^\d+$/.test(id ?? '') && Number.isInteger(productId) && productId > 0 && productId <= 2147483647

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Link to="/" className="text-[#254c40] underline underline-offset-4">← Về danh sách TV</Link>
      {validId ? <ProductDetails key={productId} id={productId} /> :
        <h1 className="mt-8 text-3xl font-bold">Địa chỉ sản phẩm không hợp lệ</h1>}
    </main>
  )
}

function ProductDetails({ id }: { id: number }) {
  const [state, setState] = useState<DetailsState>({ status: 'loading' })
  const [retry, setRetry] = useState(0)
  const addProduct = useCartStore(state => state.addProduct)

  useEffect(() => {
    const controller = new AbortController()
    getProductById(id, controller.signal)
      .then(product => {
        if (!controller.signal.aborted) setState({ status: 'success', product })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: isNotFoundError(error) ? 'not-found' : 'error' })
      })
    return () => controller.abort()
  }, [id, retry])

  if (state.status === 'loading') return <p role="status" className="mt-8">Đang tải thông tin TV…</p>
  if (state.status === 'not-found') return <h1 className="mt-8 text-3xl font-bold">Không tìm thấy sản phẩm</h1>
  if (state.status === 'error') return <div role="alert" className="mt-8 rounded-md border border-orange-200 bg-orange-50 p-6 text-orange-900">
    <p>Không tải được thông tin TV. Vui lòng thử lại.</p>
    <button type="button" className="mt-4 cursor-pointer underline" onClick={() => {
      setState({ status: 'loading' })
      setRetry(value => value + 1)
    }}>Thử lại</button>
  </div>
  if (state.status !== 'success') return null

  const { product } = state
  return <article className="mt-8 grid gap-8 rounded-lg border border-[#d9dfda] bg-white p-7 sm:p-10 lg:grid-cols-2">
    <div>{product.imageUrl
      ? <img src={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full rounded-md object-contain" />
      : <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-[#eef1ee] text-[#52645e]">Chưa có ảnh</div>}
    </div>
    <div><p className="text-sm font-bold tracking-widest text-[#436b5e]">{product.brand}</p>
    <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{product.name}</h1>
    <p className="mt-8 text-3xl font-semibold">{money.format(product.price)}</p>
    <button type="button" disabled={product.stock <= 0}
      className="mt-6 cursor-pointer rounded-md bg-[#254c40] px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => addProduct(product)}>
      Thêm vào giỏ
    </button>
    <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-[#52645e]">
      <dt>Mã sản phẩm</dt><dd>#{product.id}</dd>
      <dt>Hãng</dt><dd>{product.brand}</dd>
      <dt>Kích thước</dt><dd>{product.screenSizeInches ? `${product.screenSizeInches} inch` : 'Chưa cập nhật'}</dd>
      <dt>Độ phân giải</dt><dd>{product.resolution ?? 'Chưa cập nhật'}</dd>
      <dt>Tồn kho</dt><dd>{product.stock > 0 ? `${product.stock} sản phẩm` : 'Hết hàng'}</dd>
    </dl>
    </div>
  </article>
}
