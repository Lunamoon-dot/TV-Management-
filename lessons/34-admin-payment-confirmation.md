# Bài 34 — Admin xác nhận đã thanh toán

Bài này thêm bước vận hành thủ công trước khi có cổng thanh toán thật:

```text
Customer tạo Order (Unpaid)
  → Admin đối chiếu tiền nhận được
  → PUT /api/admin/orders/{id}/payment-status
  → PaymentStatus = Paid
  → Customer thấy Paid trong lịch sử và chi tiết
```

## API và quyền

Request:

```json
{ "status": "Paid" }
```

Endpoint được bảo vệ bằng role `Admin` và CSRF. Customer đăng nhập nhưng không có role vẫn nhận `403`. Ẩn nút trên React chỉ là UX; `[Authorize(Roles = Admin)]` mới bảo vệ dữ liệu thật.

## Transition một chiều

Hiện API chỉ cho:

```text
Unpaid → Paid
```

Không cho client gửi `Unpaid` để đảo ngược thanh toán. Gọi `Paid` lần nữa trả `204`, nên thao tác retry an toàn và không sinh thêm tác dụng phụ.

## Tương tác với hủy đơn

Đơn đã `Paid` không thể đi qua luồng hủy hiện tại. Nếu cho hủy, hệ thống cần thêm trạng thái và nghiệp vụ hoàn tiền, ví dụ `RefundPending → Refunded`, kèm mã giao dịch và audit log.

Vì phần đó chưa tồn tại, backend chặn hủy thay vì tạo dữ liệu mâu thuẫn:

```text
OrderStatus = Cancelled
PaymentStatus = Paid
```

Admin UI cũng ẩn nút hủy khi đơn đã Paid, nhưng service backend vẫn kiểm tra lại.

## Vì sao chưa gọi đây là cổng thanh toán?

Admin đang xác nhận thủ công. Hệ thống chưa:

- tạo payment transaction;
- chuyển người dùng tới nhà cung cấp;
- xác minh chữ ký webhook;
- chống xử lý webhook lặp;
- đối soát số tiền và mã đơn;
- hoàn tiền.

Khi tích hợp thật, trạng thái Paid phải đến từ kết quả đã xác minh ở backend, không từ nút phía Customer.
