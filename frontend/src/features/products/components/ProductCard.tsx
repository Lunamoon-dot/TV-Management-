import type { ProductResponse } from '../types'
import { Link } from 'react-router'
import { useCartStore } from '../../cart/stores/cart-store'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function ProductCard({ product }: { product: ProductResponse }) {
  const addProduct = useCartStore(state => state.addProduct)
  return (
    <li className="rounded-lg border border-[#d9dfda] bg-white p-7">
      <p className="text-xs font-bold tracking-[2px] text-[#436b5e]">{product.brand}</p>
      <h2 className="mt-4 mb-7 text-xl leading-relaxed font-semibold">
        <Link to={`/products/${product.id}`} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">{product.name}</Link>
      </h2>
      <p className="text-2xl font-semibold">{money.format(product.price)}</p>
      <p className="mt-3 text-sm text-[#52645e]">
        {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
      </p>
      <button type="button" disabled={product.stock <= 0}
        className="mt-6 cursor-pointer rounded-md bg-[#254c40] px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => addProduct(product)}>
        Thêm vào giỏ
      </button>
    </li>
  )
}
