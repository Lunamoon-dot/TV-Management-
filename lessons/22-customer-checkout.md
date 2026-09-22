# Bài 22 — Customer đặt hàng từ React

Bài này nối giỏ hàng của Customer với `POST /api/orders`. Đây là luồng của website mua hàng, không phải màn hình quản lý.

```text
Customer CartPage
  ↓ chỉ gửi productId + quantity
POST /api/orders + cookie + CSRF
  ↓
Backend kiểm tra user, giá và tồn kho
  ↓ 201 OrderResponse
React clear cart
  ↓
/orders/{id}/confirmation
```

## 1. API client của feature Orders

`features/orders/api/orders.ts` dùng Axios instance chung và lấy CSRF token trước khi POST. TypeScript types mô tả đúng request/response của backend.

Request không chứa email khách hàng, giá hay tổng tiền. Cookie xác định khách hàng; backend quyết định các giá trị tiền.

## 2. CartPage xử lý đặt hàng

Khi nhấn nút:

1. Nếu chưa đăng nhập, chuyển tới `/login` với `state.from = "/cart"`.
2. Đăng nhập xong, AuthPage đưa Customer quay lại giỏ hàng.
3. CartPage gửi các dòng hàng tới backend.
4. Chỉ sau response 201 mới gọi `clear()`.
5. Chuyển tới trang xác nhận và truyền `OrderResponse` do server trả về.

Trong khi request chạy, nút bị khóa để tránh người dùng nhấn liên tục trong cùng một trang. Đây là lớp bảo vệ UX; để chống request trùng một cách đầy đủ ở production, backend còn cần idempotency key ở bài nâng cao.

## 3. Xử lý lỗi

- 401: cookie không còn hợp lệ, auth store chuyển về anonymous và Customer được đưa tới login.
- 400: sản phẩm, số lượng, CSRF hoặc tồn kho không còn hợp lệ; cart được giữ nguyên.
- Lỗi mạng/500: hiện thông báo thử lại; cart vẫn được giữ nguyên.
- 201: clear cart và hiển thị dữ liệu đơn do backend xác nhận.

## 4. Trang xác nhận

Route `/orders/:id/confirmation` hiển thị mã đơn, thời gian, từng dòng hàng và tổng thanh toán. Trang dùng snapshot từ `OrderResponse`, vì vậy không dùng giá tạm tính cũ trong cart.

Hiện response được truyền bằng React Router state. Nếu refresh trực tiếp trang xác nhận, state mất và app quay về catalog. Khi có `GET /api/orders/{id}` với kiểm tra đúng chủ sở hữu, trang này sẽ tải lại đơn từ SQL và hỗ trợ refresh.

## 5. Ranh giới Customer và Admin

Các route Customer hiện tại gồm catalog, chi tiết TV, cart, auth và xác nhận đơn. Các form tạo/sửa TV xuất hiện từ bài học trước là chức năng Admin. Bước tổ chức frontend tiếp theo sẽ chuyển chúng sang `/admin/products/...` và dùng `AdminLayout` riêng; backend role authorization vẫn là lớp bảo vệ thật.
