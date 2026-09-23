# Bài 38 — Lý do hủy đơn hàng

Bài 37 cho biết ai đổi trạng thái và đổi lúc nào. Với sự kiện `Cancelled`, người vận hành còn cần biết **tại sao** đơn bị hủy.

Luồng mới:

```text
Customer/Admin nhập lý do
  → Zod kiểm tra 5–300 ký tự
  → Axios gửi JSON
  → DTO kiểm tra lại ở ASP.NET
  → controller Trim và kiểm tra độ dài thực
  → service kiểm tra đơn có được hủy không
  → hoàn kho + đổi trạng thái + lưu reason trong cùng transaction
```

## Request DTO

Customer dùng endpoint riêng nên request chỉ có lý do:

```csharp
public class CancelOrderRequest
{
    [Required]
    [StringLength(300, MinimumLength = 5)]
    public string Reason { get; set; } = string.Empty;
}
```

Admin tiếp tục dùng `UpdateOrderStatusRequest`. `Reason` là nullable vì các transition như `Pending → Confirmed` không cần lý do. Controller áp dụng quy tắc có điều kiện: nếu trạng thái đích là `Cancelled`, reason phải có ít nhất 5 ký tự sau khi trim.

Data Annotation kiểm tra request ở biên API. Kiểm tra sau `Trim()` vẫn cần thiết để chuỗi chứa chủ yếu khoảng trắng không vượt qua validation.

## Vì sao reason nằm trong history?

Reason mô tả một lần thay đổi trạng thái cụ thể. Nếu đặt một cột `CancellationReason` trực tiếp trên `Order`, ta chỉ biết lý do cuối cùng và làm model chính phình ra theo từng loại transition.

```text
OrderStatusHistory
  PreviousStatus = Confirmed
  NewStatus      = Cancelled
  Reason         = "Khách hàng yêu cầu đổi mẫu"
```

`Reason` nullable vì mốc tạo đơn, xác nhận, giao hàng và hoàn thành không cần lý do. Migration cũ cũng không thể tự đoán lý do của các đơn đã hủy trước đây.

## Transaction

`OrderCancellationService` thực hiện ba thay đổi cùng transaction:

1. cộng lại tồn kho;
2. đổi `Order.Status` thành `Cancelled`;
3. thêm history chứa actor và reason.

Nếu `SaveChanges` hoặc commit thất bại, cả ba cùng rollback. Request hủy lặp bị từ chối trước khi ghi thêm history.

## React

- Customer mở form lý do trong trang chi tiết đơn rồi mới xác nhận hủy.
- Admin mở form ngay trong dòng đơn đang xử lý.
- Cả hai dùng chung `cancelOrderSchema`, tránh hai nơi có quy tắc khác nhau.
- Timeline Admin hiển thị reason dưới sự kiện hủy.

Frontend không tự quyết định request hợp lệ cuối cùng. API vẫn kiểm tra vì người dùng có thể gọi endpoint bằng REST Client, script hoặc ứng dụng khác.

## Những gì đã kiểm tra

- Backend build không warning/error.
- Frontend 46 test, lint và production build đạt.
- Thiếu/lý do quá ngắn trả `400` và đơn không bị hủy.
- Admin hủy lưu đúng reason và email Admin.
- Customer hủy lưu đúng reason và email Customer.
- Hủy lặp không thêm history hoặc hoàn kho lần hai.
- Đơn đã Paid vẫn không được hủy dù reason hợp lệ.
- Migration `20260923090846_AddOrderCancellationReason` đã áp dụng SQL Server local.

Bài này chưa thêm danh sách mã lý do cố định. Free text phù hợp cho giai đoạn hiện tại; khi cần báo cáo thống kê, có thể bổ sung `ReasonCode` và giữ `Reason` làm ghi chú chi tiết.
