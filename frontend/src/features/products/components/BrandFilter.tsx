import { useEffect, useState } from 'react'
import { getBrands, type BrandResponse } from '../api/brands'

type BrandsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: BrandResponse[] }

export function BrandFilter({ value, onChange }: {
  value: number | undefined
  onChange: (brandId: number | undefined) => void
}) {
  const [state, setState] = useState<BrandsState>({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getBrands(controller.signal)
      .then(items => {
        if (!controller.signal.aborted) setState({ status: 'success', items })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [retry])

  return (
    <div className="mt-5">
      <label htmlFor="brand-filter" className="mb-2 block text-sm font-medium">Hãng TV</label>
      <select id="brand-filter" value={value ?? ''} disabled={state.status !== 'success'}
        onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        className="w-full rounded-md border border-[#cbd3cd] bg-white px-4 py-2 focus-visible:outline-2 focus-visible:outline-[#254c40] disabled:opacity-50 sm:w-64">
        <option value="">Tất cả hãng</option>
        {value !== undefined && (state.status !== 'success' || !state.items.some(brand => brand.id === value)) &&
          <option value={value}>Hãng #{value}</option>}
        {state.status === 'success' && state.items.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
      </select>
      {state.status === 'loading' && <p role="status" className="mt-2 text-sm">Đang tải hãng TV…</p>}
      {state.status === 'error' && <div role="alert" className="mt-2 text-sm text-orange-900">
        Không tải được danh sách hãng.{' '}
        <button type="button" className="cursor-pointer underline" onClick={() => {
          setState({ status: 'loading' })
          setRetry(current => current + 1)
        }}>Thử lại</button>
      </div>}
    </div>
  )
}
