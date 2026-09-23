# Bài 35 — Lưu dấu vết xác nhận thanh toán

`PaymentStatus = Paid` chưa đủ để vận hành. Khi có sai lệch tiền, cần biết thanh toán được xác nhận lúc nào và bởi tài khoản Admin nào.

Order được bổ sung:

```csharp
public DateTimeOffset? PaidAt { get; set; }
public string? PaymentConfirmedByEmail { get; set; }
```

Hai cột nullable vì đơn chưa thanh toán và đơn cũ không có dấu vết này.

## Ghi snapshot người xác nhận

Khi Admin đổi `Unpaid → Paid`, backend lấy tài khoản từ cookie thông qua `UserManager`, không nhận email Admin từ request:

```text
cookie Identity
  → UserManager.GetUserAsync(User)
  → admin.Email
  → PaymentConfirmedByEmail
```

Email được lưu dạng snapshot. Nếu Admin đổi email sau này, bản ghi thanh toán cũ vẫn cho biết danh tính được sử dụng tại thời điểm xác nhận.

## Retry không được sửa lịch sử

Endpoint kiểm tra `PaymentStatus == Paid` và trả `204` trước khi gán audit fields. Vì vậy lần retry không cập nhật `PaidAt` hoặc thay người xác nhận ban đầu.

```text
Lần đầu: Unpaid → Paid + PaidAt + Admin email
Lần sau: Paid → trả 204, không SaveChanges
```

Integration test đọc đơn sau lần đầu, gọi lại endpoint và xác nhận timestamp không đổi.

## Dữ liệu Customer và Admin

- Customer response có `PaidAt` để biết thời điểm thanh toán được ghi nhận.
- Admin response có cả `PaidAt` và `PaymentConfirmedByEmail` để phục vụ vận hành.

Không cần gửi email nội bộ của Admin trong API Customer.

Đây mới là audit tối thiểu. Hệ thống lớn thường dùng bảng sự kiện bất biến chứa loại thao tác, actor ID, thời gian, dữ liệu trước/sau và correlation ID.
