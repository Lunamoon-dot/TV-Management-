# Bài 50: backend unit test với xUnit

## Vì sao cần thêm unit test?

Các PowerShell integration test hiện tại gọi HTTP thật và SQL Server thật. Chúng chứng minh toàn bộ hệ thống phối hợp đúng nhưng chạy chậm hơn, cần database và khó đưa ngay lên Ubuntu CI.

Quy tắc transition trạng thái là logic thuần:

```text
Pending   → Confirmed hoặc Cancelled
Confirmed → Shipped hoặc Cancelled
Shipped   → Completed
Completed / Cancelled → không chuyển tiếp
```

Rule này có thể kiểm tra nhanh mà không khởi động web server hoặc database.

## Tách policy nghiệp vụ

`OrderStatusPolicy` chứa:

```csharp
CanTransition(current, next)
CanCustomerCancel(status)
CanAdminCancel(status)
```

Controller và `OrderCancellationService` gọi cùng policy, thay vì mỗi nơi tự viết lại điều kiện. Đây là một abstraction có lý do cụ thể: rule được dùng ở nhiều nơi và cần được test độc lập.

Policy không truy cập database, HTTP hoặc thời gian hệ thống nên test ổn định và rất nhanh.

## Cấu trúc test project

Solution hiện có hai project:

```text
nothing.slnx
├── nothing/          ASP.NET application
└── nothing.Tests/    xUnit tests
```

Test project reference application project, nhờ đó có thể gọi `OrderStatusPolicy` và dùng enum `OrderStatus`.

## Fact và Theory

`[Fact]` dành cho một kịch bản cụ thể:

```csharp
[Fact]
public void Customer_can_only_cancel_pending_orders()
```

`[Theory]` chạy cùng một test với nhiều bộ dữ liệu:

```csharp
[Theory]
[MemberData(nameof(AllowedTransitions))]
public void Allows_defined_workflow_transitions(
    OrderStatus current,
    OrderStatus next)
```

Tên test mô tả hành vi nghiệp vụ, không mô tả chi tiết implementation.

## Unit test và integration test bổ sung cho nhau

Unit test xác nhận bảng rule nhanh:

```text
OrderStatusPolicy → kết quả true/false
```

Integration test xác nhận hệ thống thật:

```text
HTTP → auth/role/CSRF → controller → policy → EF transaction → SQL
```

Chỉ có unit test sẽ bỏ sót route, authorization, transaction và mapping. Chỉ có integration test khiến rule nhỏ khó kiểm tra hết và CI phức tạp hơn.

## CI đã thay đổi

GitHub Actions giờ restore/build toàn solution rồi chạy:

```bash
dotnet test nothing.Tests/nothing.Tests.csproj \
  --configuration Release --no-build --no-restore
```

Sau test, workflow mới publish ứng dụng React + ASP.NET như trước.

## Kiểm chứng

- Solution Release build: 0 warning/error.
- 12 xUnit tests đạt trong khoảng 0,35 giây.
- Integration Admin Orders vẫn đạt toàn bộ sau refactor.
- Test tự dọn account/order và phục hồi stock.
- Không thay đổi schema hoặc migration.
