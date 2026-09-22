# Bài 26 — Admin xử lý trạng thái đơn

Bài này thêm phần quản trị đơn ở mức vừa đủ: Admin xem danh sách và chuyển trạng thái theo các bước hợp lệ. Chưa thêm service, repository, audit log hay thông báo để giữ bài học tập trung.

## API Admin

```text
GET /api/admin/orders?page=1&pageSize=20
PUT /api/admin/orders/{id}/status
```

Controller có `[Authorize(Roles = Admin)]`. Customer đăng nhập vẫn nhận 403. PUT còn yêu cầu CSRF vì nó thay đổi dữ liệu.

Danh sách trả mã đơn, email khách, thời gian, tổng tiền, số dòng hàng và trạng thái. Nó không trả password hash hoặc toàn bộ ApplicationUser.

## Quy tắc chuyển trạng thái

Backend quyết định transition, không tin nút đang hiển thị ở frontend:

```text
Pending   → Confirmed | Cancelled
Confirmed → Shipped   | Cancelled
Shipped   → Completed
Completed → không đổi
Cancelled → không đổi
```

Ví dụ `Pending → Completed` trả 400. Điều này ngăn request tự chế bỏ qua quy trình dù người dùng sửa JavaScript hoặc gọi API bằng công cụ khác.

## Giao diện Admin

Sidebar có route `/admin/orders`. Bảng hiển thị đơn và chỉ tạo các nút hợp lệ cho trạng thái hiện tại. Sau response 204, React cập nhật badge của đúng dòng. Nếu API từ chối, giao diện giữ trạng thái cũ và hiện lỗi.

Frontend giúp UX; bảng `CanTransition` trong backend mới là quy tắc nghiệp vụ thật.

## Kiểm thử

`tests/admin-order-status.ps1` tạo một Customer và một Admin tạm, tạo đơn rồi xác nhận:

- Customer gọi danh sách Admin nhận 403.
- Admin nhìn thấy đơn.
- Nhảy `Pending → Completed` nhận 400.
- `Pending → Confirmed → Shipped → Completed` đều nhận 204.
- `Completed → Cancelled` nhận 400.
- Customer đọc lại thấy `Completed`.

Cuối test, đơn, tài khoản và thay đổi tồn kho đều được dọn.
