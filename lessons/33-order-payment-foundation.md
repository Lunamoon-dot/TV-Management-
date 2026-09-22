# Bài 33 — Tách trạng thái đơn hàng và thanh toán

Một đơn hàng có hai vòng đời khác nhau:

```text
OrderStatus:   Pending → Confirmed → Shipped → Completed
PaymentStatus: Unpaid → Paid
```

`Shipped` không đồng nghĩa `Paid`: đơn COD có thể đang giao nhưng chưa thu tiền. Ngược lại, đơn chuyển khoản có thể đã thanh toán trong khi vẫn `Pending`. Vì vậy không nên dùng một enum cho cả hai khái niệm.

## Model mới

`PaymentMethod` hiện có:

- `CashOnDelivery` — thanh toán khi nhận hàng;
- `BankTransfer` — chuyển khoản ngân hàng.

`PaymentStatus` hiện có `Unpaid` và `Paid`. Đơn mới luôn bắt đầu `Unpaid`; client chỉ được chọn phương thức, không được tự gửi trạng thái `Paid`.

Đây là ranh giới bảo mật quan trọng:

```json
{
  "paymentMethod": "BankTransfer"
}
```

Request không có `paymentStatus`. Về sau chỉ backend sau khi xác minh thanh toán mới đổi trạng thái đó.

## Enum qua ba lớp

- React dùng string union để TypeScript bắt lỗi tên giá trị.
- ASP.NET dùng `JsonStringEnumConverter` để bind chuỗi JSON vào enum và trả enum dưới dạng chuỗi.
- EF Core dùng `HasConversion<string>()` để SQL lưu `CashOnDelivery`, `BankTransfer`, `Unpaid`, `Paid` thay cho số khó đọc.

## Migration cho dữ liệu cũ

Migration sinh tự động ban đầu chọn chuỗi rỗng cho cột `NOT NULL`. Chuỗi rỗng không chuyển được về enum. Migration đã được sửa để backfill đơn cũ bằng:

```text
PaymentMethod = CashOnDelivery
PaymentStatus = Unpaid
```

Đây là ví dụ migration build thành công nhưng vẫn sai về dữ liệu nghiệp vụ nếu không review file sinh ra.

## Phạm vi hiện tại

Customer chọn phương thức ở checkout và thấy phương thức/trạng thái trong lịch sử, chi tiết đơn. Chưa có số tài khoản, mã giao dịch, webhook hoặc endpoint đánh dấu Paid. Bài tiếp theo có thể làm luồng chuyển khoản giả lập trước khi tích hợp cổng thật.
