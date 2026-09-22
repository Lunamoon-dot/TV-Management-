import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getProducts } from '../../products/api/products'
import type { ProductPageResponse } from '../../products/types'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'success'; data: ProductPageResponse }
  >({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getProducts(controller.signal, page, '', undefined, 20)
      .then(data => {
        if (!controller.signal.aborted) setResult({ status: 'success', data })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ status: 'error' })
      })
    return () => controller.abort()
  }, [page, retry])

  return <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">QUẢN TRỊ / SẢN PHẨM</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Danh sách TV.</h1>
      </div>
      <Link to="/admin/products/new" className="rounded-md bg-[#254c40] px-5 py-3 text-center text-white">+ Thêm TV</Link>
    </div>

    {result.status === 'loading' && <p role="status" className="mt-8">Đang tải sản phẩm…</p>}
    {result.status === 'error' && <div role="alert" className="mt-8 rounded-md border border-orange-200 bg-orange-50 p-5 text-orange-900">
      <p>Không tải được danh sách quản lý. Hãy thử lại.</p>
      <button type="button" className="mt-3 cursor-pointer underline" onClick={() => {
        setResult({ status: 'loading' })
        setRetry(value => value + 1)
      }}>Thử lại</button>
    </div>}
    {result.status === 'success' && <div className="mt-8 overflow-x-auto rounded-lg border border-[#d2d9d4] bg-white">
      <table className="w-full min-w-[680px] text-left">
        <thead className="border-b border-[#d2d9d4] bg-[#f7f8f6] text-sm text-[#52645e]">
          <tr><th className="px-5 py-4">TV</th><th className="px-5 py-4">Hãng</th><th className="px-5 py-4">Giá</th><th className="px-5 py-4">Tồn kho</th><th className="px-5 py-4">Thao tác</th></tr>
        </thead>
        <tbody className="divide-y divide-[#e1e5e2]">
          {result.data.items.map(product => <tr key={product.id}>
            <td className="px-5 py-4 font-semibold">{product.name}</td>
            <td className="px-5 py-4">{product.brand}</td>
            <td className="px-5 py-4">{money.format(product.price)}</td>
            <td className="px-5 py-4">{product.stock}</td>
            <td className="px-5 py-4"><Link to={`/admin/products/${product.id}/edit`} className="text-[#254c40] underline">Sửa</Link></td>
          </tr>)}
        </tbody>
      </table>
      {result.data.items.length === 0 && <p className="p-5">Chưa có sản phẩm.</p>}
      <nav aria-label="Phân trang quản lý sản phẩm" className="flex items-center justify-between border-t border-[#d2d9d4] px-5 py-4">
        <button type="button" disabled={page <= 1} className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-40" onClick={() => {
          setResult({ status: 'loading' })
          setPage(value => value - 1)
        }}>Trang trước</button>
        <span>Trang {result.data.page}</span>
        <button type="button" disabled={page * result.data.pageSize >= result.data.totalCount} className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-40" onClick={() => {
          setResult({ status: 'loading' })
          setPage(value => value + 1)
        }}>Trang sau</button>
      </nav>
    </div>}
  </main>
}
