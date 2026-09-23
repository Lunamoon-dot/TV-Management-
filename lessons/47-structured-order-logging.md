# Bài 47: Structured logging trong luồng đơn hàng

## Log kỹ thuật và log nghiệp vụ

Framework đã ghi nhiều log kỹ thuật như server khởi động, SQL connection hoặc exception. Ứng dụng vẫn cần log các mốc nghiệp vụ giúp trả lời:

- Đơn nào vừa được tạo?
- Checkout nào bị từ chối vì thiếu hàng?
- Trạng thái nào vừa thay đổi?
- Hủy đơn có hoàn tồn kho hay chưa?

Không cần log mọi dòng code hoặc mọi request body.

## Structured logging

Project sử dụng message template:

```csharp
_logger.LogInformation(
    "Changed order {OrderId} status from {PreviousStatus} to {NextStatus}",
    order.Id,
    previousStatus,
    nextStatus);
```

Console hiển thị thành câu dễ đọc, đồng thời logging provider có thể lưu `OrderId`, `PreviousStatus` và `NextStatus` thành field riêng. Khi dùng hệ thống log tập trung, ta có thể lọc `OrderId = 39` thay vì tìm chuỗi thủ công.

Không nên dùng string interpolation:

```csharp
// Tránh dùng cho structured logging
_logger.LogInformation($"Changed order {order.Id}");
```

Interpolation tạo chuỗi trước khi logger xử lý và làm mất property có tên.

## Các log đã thêm

### Information

- Tạo đơn thành công: order ID, số dòng hàng, tổng tiền, phương thức thanh toán.
- Idempotent checkout trả lại đơn cũ: order ID và checkout ID.
- Admin xác nhận thanh toán.
- Admin đổi trạng thái đơn.
- Hủy đơn thành công và hoàn tồn kho.

### Warning

- Checkout tham chiếu product không tồn tại.
- Tồn kho thấp hơn số lượng yêu cầu.
- Transition trạng thái không hợp lệ.
- Hủy đơn không tồn tại/không thuộc Customer, đã thanh toán hoặc sai trạng thái.

`Warning` nghĩa là tình huống bất thường nhưng ứng dụng đã xử lý và trả response hợp lệ. Exception không xử lý tiếp tục dùng `Error` trong `GlobalExceptionHandler`.

## Dữ liệu không ghi vào log

Các log mới không chứa:

- mật khẩu, cookie hoặc CSRF token;
- họ tên, số điện thoại và địa chỉ giao hàng;
- email người dùng;
- nội dung ghi chú hoặc lý do hủy;
- toàn bộ request/response body.

ID nội bộ, trạng thái và số lượng đủ để điều tra phần lớn lỗi mà giảm nguy cơ lộ dữ liệu cá nhân.

## Correlation ID trong console

Console logging đã bật scope. Một log thực tế có dạng:

```text
info: nothing.Features.Orders.OrdersController
      => CorrelationId: 5c1e1e32e3fb414bbbb69e6f306810f2
      Created order 39 with 1 line items and total 11990000.00 using CashOnDelivery
```

Frontend nhận cùng ID trong response header nên có thể cung cấp mã đó khi báo lỗi.

## Lọc log theo category

`appsettings.json` giữ log ứng dụng ở `Information`, nhưng đặt câu lệnh SQL của EF Core ở `Warning` để console không bị ngập:

```json
"Microsoft.EntityFrameworkCore.Database.Command": "Warning"
```

Khi cần xem SQL để học hoặc debug query, tạm đổi category này thành `Information`, chạy lại ứng dụng rồi hoàn nguyên.

## Kiểm chứng

- Backend build không warning/error.
- Integration test Admin Orders đạt toàn bộ.
- Console thực tế hiển thị create, rejected transition, successful transition và cancellation cùng Correlation ID.
- Test tự dọn order/account và phục hồi tồn kho.
- Không có migration hoặc thay đổi schema.
