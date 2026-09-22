import { ProductsPage } from '../features/products/pages/ProductsPage'
import { Link, Route, Routes } from 'react-router'
import { ProductDetailsPage } from '../features/products/pages/ProductDetailsPage'
import { CreateProductPage } from '../features/products/pages/CreateProductPage'
import { EditProductPage } from '../features/products/pages/EditProductPage'
import { useEffect } from 'react'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { useAuthStore } from '../features/auth/stores/auth-store'
import { RequireAdmin } from '../features/auth/components/RequireAdmin'
import { CartPage } from '../features/cart/pages/CartPage'
import { OrderConfirmationPage } from '../features/orders/pages/OrderConfirmationPage'
import { CustomerLayout } from './layouts/CustomerLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage'
import { AdminProductsPage } from '../features/admin/pages/AdminProductsPage'
import { RequireAuthenticated } from '../features/auth/components/RequireAuthenticated'
import { OrderHistoryPage } from '../features/orders/pages/OrderHistoryPage'

export default function App() {
  const refresh = useAuthStore(state => state.refresh)
  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])

  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/login" element={<AuthPage key="login" mode="login" />} />
        <Route path="/register" element={<AuthPage key="register" mode="register" />} />
        <Route path="/" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<RequireAuthenticated><OrderHistoryPage /></RequireAuthenticated>} />
        <Route path="/orders/:id" element={<RequireAuthenticated><OrderConfirmationPage /></RequireAuthenticated>} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="*" element={<main className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="mb-5 text-3xl font-bold">Trang không tồn tại</h1>
          <Link to="/" className="underline">Về danh sách TV</Link>
        </main>} />
      </Route>
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<CreateProductPage />} />
        <Route path="products/:id/edit" element={<EditProductPage />} />
      </Route>
    </Routes>
  )
}
