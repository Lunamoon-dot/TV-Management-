# Bài 27 — Hủy đơn và hoàn tồn kho

Khi Customer đặt hàng, backend đã giảm `Product.Stock`. Vì vậy nếu Admin hủy đơn, hệ thống phải cộng lại đúng số lượng của từng `OrderItem`.

## Một transaction cho hai thay đổi

Hủy đơn gồm hai phần không được tách rời:

1. Đổi `Order.Status` thành `Cancelled`.
2. Cộng `OrderItem.Quantity` trở lại `Product.Stock`.

Controller mở transaction `Serializable`, tải Order cùng Items và Product, kiểm tra transition rồi thực hiện cả hai phần trước `SaveChangesAsync` và `CommitAsync`.

Nếu bất kỳ thao tác nào lỗi, transaction rollback: đơn không bị đánh dấu hủy một nửa và tồn kho không bị hoàn một phần.

## Vì sao không cộng tồn kho hai lần?

Transition chỉ cho phép `Pending → Cancelled` và `Confirmed → Cancelled`. Sau lần đầu, trạng thái đã là `Cancelled`; request hủy tiếp theo bị trả 400 trước khi cộng Stock.

Frontend không tự hoàn kho. Nút Admin chỉ gửi trạng thái mong muốn; backend chịu trách nhiệm bảo vệ quy tắc và cập nhật SQL.

## Phạm vi hiện tại

Bài này chưa xử lý hoàn tiền hoặc gọi đơn vị vận chuyển. `Shipped` không được chuyển sang `Cancelled` trong workflow hiện tại vì việc thu hồi hàng cần một nghiệp vụ riêng.

Integration test xác nhận:

- Tạo đơn làm Stock giảm một.
- `Confirmed → Cancelled` trả 204 và Stock trở về giá trị ban đầu.
- Hủy lại trả 400 và Stock không tăng thêm.
- Customer đọc lại thấy `Cancelled`.
