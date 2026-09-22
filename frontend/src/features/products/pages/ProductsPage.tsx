import { useEffect, useState } from 'react'
import { ProductCard } from '../components/ProductCard'
import { BrandFilter } from '../components/BrandFilter'
import { useProductStore } from '../stores/product-store'

const pageButtonClass = 'cursor-pointer rounded-md border border-[#254c40] px-4 py-2 text-[#254c40] hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-40'

export function ProductsPage() {
  const result = useProductStore(state => state.result)
  const loadProducts = useProductStore(state => state.loadProducts)
  const cancelLoad = useProductStore(state => state.cancelLoad)
  const search = useProductStore(state => state.search)
  const searchProducts = useProductStore(state => state.searchProducts)
  const brandId = useProductStore(state => state.brandId)
  const filterByBrand = useProductStore(state => state.filterByBrand)
  const [draftSearch, setDraftSearch] = useState(search)
  const loading = result.status === 'idle' || result.status === 'loading'

  useEffect(() => {
    void loadProducts()
    return cancelLoad
  }, [loadProducts, cancelLoad])

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-16">
      <header className="flex flex-col items-start justify-between gap-6 border-b border-[#cbd3cd] pb-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">TV STORE / DANH MỤC</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Tìm chiếc TV của bạn.</h1>
        </div>
        <button type="button" disabled={loading} onClick={() => void loadProducts()}
          className="cursor-pointer rounded-md bg-[#254c40] px-6 py-3 whitespace-nowrap text-white hover:bg-[#19372e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-50">
          Tải lại
        </button>
      </header>
      <form className="mt-7 flex flex-wrap items-end gap-3" onSubmit={event => {
        event.preventDefault()
        void searchProducts(draftSearch)
      }}>
        <div className="min-w-0 flex-1 basis-60">
          <label htmlFor="product-search" className="mb-2 block text-sm font-medium">Tìm theo tên TV</label>
          <input id="product-search" type="search" maxLength={200} value={draftSearch}
            onChange={event => setDraftSearch(event.target.value)} placeholder="Ví dụ: Samsung, LG, 55 inch"
            className="w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-2 focus-visible:outline-2 focus-visible:outline-[#254c40]" />
        </div>
        <button type="submit" className={pageButtonClass}>Tìm kiếm</button>
        <button type="button" className={pageButtonClass} onClick={() => {
          setDraftSearch('')
          void searchProducts('')
        }}>Xóa tìm kiếm</button>
      </form>
      <BrandFilter value={brandId} onChange={value => void filterByBrand(value)} />
      {loading && <p className="mt-7" role="status">Đang tải danh sách TV…</p>}
      {result.status === 'error' && <p className="mt-7 rounded-md border border-orange-200 bg-orange-50 p-5 text-orange-900" role="alert">{result.message}</p>}
      {result.status === 'success' && <>
        <p className="my-7 text-[#52645e]">Hiển thị {result.data.items.length} / {result.data.totalCount} TV · Trang {result.data.page}{search && <> · Từ khóa: “{search}”</>}</p>
        {result.data.items.length === 0 ? <p>{search || brandId !== undefined ? 'Không tìm thấy TV phù hợp. Hãy thử từ khóa hoặc hãng khác.' : 'Chưa có TV để hiển thị.'}</p> :
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.items.map(product => <ProductCard key={product.id} product={product} />)}
          </ul>}
        <nav aria-label="Phân trang sản phẩm" className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" className={pageButtonClass} disabled={result.data.page <= 1}
            onClick={() => void loadProducts(result.data.page - 1)}>Trang trước</button>
          <span aria-live="polite">Trang {result.data.page} / {Math.max(1, Math.ceil(result.data.totalCount / result.data.pageSize))}</span>
          <button type="button" className={pageButtonClass}
            disabled={result.data.page * result.data.pageSize >= result.data.totalCount}
            onClick={() => void loadProducts(result.data.page + 1)}>Trang sau</button>
        </nav>
      </>}
    </main>
  )
}
