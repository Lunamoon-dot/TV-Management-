# Bài 24 — Lịch sử đơn hàng và quyền sở hữu

Bài này bổ sung hai endpoint đọc đơn cho Customer và nối chúng vào React:

```text
GET /api/orders?page=1&pageSize=10
GET /api/orders/{id}
```

Cả hai đều yêu cầu cookie đăng nhập. GET không thay đổi dữ liệu nên không cần CSRF token.

## 1. Quyền sở hữu nằm trong truy vấn

Backend lấy `userId` từ identity trong cookie, rồi thêm điều kiện vào SQL:

```csharp
.Where(order => order.Id == id && order.CustomerId == userId)
```

Không nhận `customerId` từ query string hay URL vì người dùng có thể sửa chúng. Customer chỉ được xem dữ liệu gắn với chính identity đã xác thực.

Nếu ID không tồn tại hoặc thuộc người khác, API đều trả 404. Cách này vừa đơn giản cho client vừa không tiết lộ rằng một đơn của tài khoản khác tồn tại.

## 2. Projection trực tiếp sang response DTO

Query dùng `Select` để SQL chỉ trả các trường cần cho `OrderResponse` và `OrderItemResponse`. Entity `ApplicationUser`, password hash và các trường nội bộ không được tải hoặc trả về client.

Danh sách sắp xếp `CreatedAt` giảm dần rồi `Id` giảm dần để thứ tự ổn định. `OrderQueryRequest` giới hạn page từ 1 và pageSize tối đa 50. Response gồm `items`, `totalCount`, `page`, `pageSize` giống nguyên tắc phân trang catalog.

## 3. Route Customer được bảo vệ

React thêm `RequireAuthenticated` cho `/orders` và `/orders/:id`:

- Auth đang load: chờ kiểm tra session.
- Anonymous: chuyển tới login và lưu đường dẫn cần quay lại.
- Auth lỗi: hiện trạng thái lỗi.
- Đã đăng nhập: render trang con.

Đây là xử lý UX. API `[Authorize]` và điều kiện `CustomerId` vẫn là bảo vệ thật.

## 4. Trang xác nhận có thể refresh

Sau khi tạo đơn, CartPage chỉ chuyển tới `/orders/{id}`. Trang chi tiết tự gọi `GET /api/orders/{id}` thay vì phụ thuộc vào Router state, nên refresh hoặc mở lại URL vẫn hoạt động.

Trang `/orders` tải lịch sử có phân trang, hiển thị mã đơn, thời gian, số dòng và tổng tiền. Thanh tài khoản chỉ hiện link “Đơn hàng” khi user đã đăng nhập.

## 5. Kiểm thử quyền sở hữu

`tests/order-ownership.ps1` tạo hai tài khoản tạm:

1. User A tạo một đơn.
2. User A thấy đơn trong lịch sử và xem được chi tiết.
3. User B không thấy đơn trong lịch sử.
4. User B gọi trực tiếp ID của A nhận 404.
5. Anonymous gọi lịch sử nhận 401.

Cuối test, order, order item và hai user tạm được xóa; tồn kho được cộng lại.
