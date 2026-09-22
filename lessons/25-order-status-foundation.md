# Bài 25 — Nền tảng trạng thái đơn hàng

Một đơn hàng thực tế không chỉ có dữ liệu sản phẩm và tổng tiền. Nó còn đi qua một vòng đời. Bài này thêm trạng thái vào entity, database, API và giao diện Customer.

```text
Pending → Confirmed → Shipped → Completed
    └──────────────→ Cancelled
```

Các giá trị hiện có:

- `Pending`: Customer vừa đặt, chờ cửa hàng xác nhận.
- `Confirmed`: cửa hàng đã chấp nhận đơn.
- `Shipped`: đơn đang được giao.
- `Completed`: giao dịch hoàn tất.
- `Cancelled`: đơn đã hủy.

## 1. Vì sao dùng enum trong C#?

`OrderStatus` giới hạn code vào năm trạng thái hợp lệ. So với string tự do, compiler có thể phát hiện nhiều lỗi và code chuyển trạng thái rõ ràng hơn.

Entity khởi tạo:

```csharp
public OrderStatus Status { get; set; } = OrderStatus.Pending;
```

Vì vậy mọi đơn mới tạo qua code bắt đầu ở `Pending`; client không được gửi trạng thái khi checkout.

## 2. Vì sao SQL lưu chuỗi?

EF cấu hình `HasConversion<string>()`, nên database lưu `Pending` thay vì số `0`. Chuỗi dễ đọc khi kiểm tra SQL và không làm sai dữ liệu nếu sau này thứ tự enum thay đổi. Cột giới hạn 20 ký tự và bắt buộc có giá trị.

Migration `AddOrderStatus` thêm cột với default `Pending`. Default này đặc biệt quan trọng cho các đơn đã tồn tại trước migration; chúng không được nhận chuỗi rỗng.

## 3. Response API

`OrderResponse.Status` dùng enum nhưng được `JsonStringEnumConverter` serialize thành chuỗi JSON:

```json
{
  "id": 12,
  "status": "Pending"
}
```

Frontend khai báo union type tương ứng, nhờ đó component không nhận trạng thái tùy ý.

## 4. Hiển thị cho Customer

`OrderStatusBadge` ánh xạ trạng thái kỹ thuật sang nhãn tiếng Việt và màu riêng. Trang lịch sử và chi tiết đơn cùng tái sử dụng component này.

Bài này chưa cho phép thay đổi trạng thái. Bài tiếp theo sẽ làm API Admin và quy tắc chuyển trạng thái; không cho phép nhảy tùy ý từ `Pending` thẳng sang `Completed` hoặc sửa đơn đã `Cancelled`.
