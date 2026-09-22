import { Link, useNavigate } from 'react-router'
import { createProduct } from '../api/products'
import { ProductForm } from '../components/ProductForm'

export function CreateProductPage() {
  const navigate = useNavigate()
  return <main className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
    <Link to="/admin/products" className="text-[#254c40] underline underline-offset-4">← Về danh sách quản lý</Link>
    <h1 className="mt-8 text-3xl font-bold">Thêm TV</h1>
    <ProductForm
      initialValues={{ name: '', brandId: '', price: '', stock: '' }}
      submitLabel="Tạo TV"
      failureMessage="Chưa xác nhận được kết quả tạo TV. Hãy kiểm tra danh sách trước khi gửi lại để tránh tạo trùng."
      onSubmit={async request => {
        const product = await createProduct(request)
        navigate(`/admin/products/${product.id}/edit`, { replace: true })
      }}
    />
  </main>
}
