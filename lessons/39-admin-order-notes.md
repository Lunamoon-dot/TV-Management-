# Bài 39 — Ghi chú nội bộ cho đơn hàng

Lịch sử trạng thái mô tả các transition chính thức. Nhân viên vận hành còn cần lưu thông tin không làm thay đổi trạng thái, chẳng hạn “đã gọi xác nhận địa chỉ” hoặc “khách muốn giao sau 18 giờ”. Đây là **ghi chú nội bộ**, không phải status event.

## Vì sao dùng bảng riêng?

```text
Order 1 ──── * OrderStatusHistory  (workflow chính thức)
Order 1 ──── * OrderNote           (trao đổi vận hành)
```

Nếu nhét note vào status history, Admin phải tạo transition giả chỉ để ghi một thông tin. Nếu đặt một cột `Note` trên Order, mỗi lần ghi sẽ đè nội dung cũ và mất tác giả/thời gian.

`OrderNote` lưu:

- `OrderId`;
- `Content`;
- `CreatedAt`;
- `CreatedByEmail` lấy từ Identity cookie.

Foreign key dùng cascade để note được dọn khi đơn bị xóa. Index `(OrderId, CreatedAt)` phục vụ tải note theo đơn và thời gian.

## API và phân quyền

```http
POST /api/admin/orders/{id}/notes
Content-Type: application/json
X-CSRF-TOKEN: ...

{
  "content": "Đã gọi xác nhận địa chỉ"
}
```

Endpoint nằm trong `AdminOrdersController`, nên kế thừa `[Authorize(Roles = Admin)]`. Nó còn dùng anti-forgery token vì request làm thay đổi dữ liệu.

Backend kiểm tra nội dung 3–1000 ký tự, trim, xác nhận Order tồn tại, lấy Admin từ cookie rồi trả `201` cùng note vừa tạo. Client không được gửi email người tạo.

## Không làm lộ dữ liệu nội bộ

`AdminOrderDetailsResponse` có `Notes`, còn `OrderResponse` của Customer không có thuộc tính này. Đây là lý do DTO theo use case quan trọng: cùng đọc một Order nhưng hai vai trò nhận hai contract khác nhau.

Chỉ ẩn section trong React không đủ bảo mật. Integration test gọi thẳng endpoint bằng cookie Customer và xác nhận `403`; response chi tiết Customer cũng được kiểm tra không có field `notes`.

## React

Trang `/admin/orders/:id` có form note dùng Zod 3–1000 ký tự. Sau response `201`, note mới được thêm vào đầu danh sách trong state mà không tải lại cả trang. Nếu request lỗi, nội dung đang nhập vẫn được giữ để Admin thử lại.

Các note được sắp mới nhất trước. Nội dung dùng `whitespace-pre-wrap` để giữ xuống dòng nhưng React vẫn escape text, tránh render chuỗi nhập vào như HTML.

## Những gì đã kiểm tra

- Backend build không warning/error.
- Frontend 48 test, lint và production build đạt.
- Customer tạo note nhận `403`.
- Nội dung trắng nhận `400`.
- Admin tạo note nhận `201`, nội dung được trim và actor đúng.
- GET chi tiết Admin trả note vừa tạo.
- Response Customer không chứa note nội bộ.
- Migration `20260923091536_AddOrderNotes` đã áp dụng SQL Server local.

Phiên bản này chỉ cho phép thêm và đọc note. Chưa sửa/xóa để giữ audit đơn giản và tránh âm thầm thay đổi lịch sử trao đổi.
