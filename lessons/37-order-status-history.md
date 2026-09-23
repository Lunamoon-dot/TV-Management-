# Bài 37 — Lịch sử trạng thái đơn hàng

`Order.Status` chỉ trả lời trạng thái **hiện tại**. Nếu đơn đang `Cancelled`, riêng cột này không cho biết trước đó là `Pending` hay `Confirmed`, ai hủy và hủy lúc nào.

Bài này thêm bảng `OrderStatusHistories`. Mỗi dòng là một sự kiện đã xảy ra:

```text
Order #25
  null      → Pending    | customer@example.com | 08:00
  Pending   → Confirmed  | admin@example.com    | 08:10
  Confirmed → Cancelled  | admin@example.com    | 08:20
```

## Model quan hệ

```text
Order 1 ──── * OrderStatusHistory
```

Một history chứa `OrderId`, `PreviousStatus`, `NewStatus`, `ChangedAt` và `ChangedByEmail`. `PreviousStatus` nullable vì sự kiện đầu tiên biểu diễn lúc đơn được tạo.

Email là snapshot lấy từ Identity cookie. Endpoint không nhận `changedByEmail` từ body, vì client không được tự khai người thực hiện.

## Ghi lịch sử cùng nghiệp vụ

Khi tạo đơn, backend thêm mốc `null → Pending`. Khi đổi trạng thái:

```csharp
var previousStatus = order.Status;
order.Status = nextStatus;
order.StatusHistory.Add(new OrderStatusHistory
{
    PreviousStatus = previousStatus,
    NewStatus = nextStatus,
    ChangedAt = DateTimeOffset.UtcNow,
    ChangedByEmail = admin.Email
});

await _context.SaveChangesAsync(cancellationToken);
```

Việc đổi trạng thái và thêm history nằm trong cùng `SaveChanges` và transaction của nghiệp vụ. Nếu có lỗi, cả hai cùng rollback. Luồng hủy còn bao gồm hoàn tồn kho trong cùng transaction.

Transition không hợp lệ hoặc thao tác hủy lặp trả lỗi trước khi thêm history, vì vậy timeline không có sự kiện giả hoặc trùng.

## Migration và dữ liệu cũ

Migration `AddOrderStatusHistory` tạo bảng, foreign key cascade và index `(OrderId, ChangedAt)`. Sau đó migration backfill một mốc cho mỗi đơn cũ bằng trạng thái hiện tại, ngày tạo đơn và email Customer.

Backfill không thể tái tạo những transition đã xảy ra trước khi có bảng audit. Nó chỉ tạo một mốc bắt đầu trung thực với dữ liệu còn biết được.

## Đọc timeline

`AdminOrderDetailsResponse` trả `StatusHistory` theo `ChangedAt`, sau đó theo `Id`. Trang `/admin/orders/:id` hiển thị timeline tiếng Việt.

Chi tiết đơn cùng lúc tải hai collection là `Items` và `StatusHistory`. Endpoint dùng `AsSplitQuery()` để EF Core tách truy vấn, tránh số dòng trung gian bị nhân lên theo `số item × số history`.

## Những gì đã kiểm tra

- Backend build không warning/error.
- Frontend 44 test, lint và production build đạt.
- Migration đã áp dụng lên SQL Server local và backfill đơn cũ.
- Tạo đơn ghi Customer với `null → Pending`.
- Admin xác nhận/hủy ghi đúng email và cặp trạng thái.
- Customer tự hủy cũng ghi đúng email.
- Hủy lặp bị chặn, không thêm history và không hoàn kho lần hai.

Đây là audit cho trạng thái đơn, chưa phải hệ thống event tổng quát. Chưa cần thêm message broker, event sourcing hoặc abstraction phức tạp ở giai đoạn này.
