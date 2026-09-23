# Bài 42 — Database cloud: retry và health checks

Database local thường nằm cùng máy và kết nối ổn định. Database cloud đi qua mạng nên có thể gặp lỗi tạm thời: kết nối bị reset, failover, throttling hoặc node đang chuyển vai trò. Hai khả năng vận hành cơ bản là:

1. retry có giới hạn cho lỗi SQL được xác định là transient;
2. health check để nền tảng deploy biết API còn sống và đã sẵn sàng nhận traffic hay chưa.

## Retry lỗi tạm thời

SQL Server provider được cấu hình:

```csharp
sqlServer.EnableRetryOnFailure(
    maxRetryCount: 3,
    maxRetryDelay: TimeSpan.FromSeconds(5),
    errorNumbersToAdd: null)
```

EF chỉ retry các lỗi mà provider nhận diện là transient. Validation sai, unique violation, `404`, concurrency `409` hoặc lỗi nghiệp vụ không tự biến thành thành công nhờ retry.

Retry phải có giới hạn. Retry vô hạn làm request treo lâu và tăng tải lên database đang gặp sự cố.

## Execution strategy và transaction thủ công

Project có transaction `Serializable` cho checkout, hủy đơn và cập nhật trạng thái. Khi retry được bật, không thể chỉ gọi `BeginTransactionAsync` như trước. EF cần có khả năng chạy lại **toàn bộ transaction**:

```csharp
var strategy = context.Database.CreateExecutionStrategy();

return await strategy.ExecuteAsync(async () =>
{
    await using var transaction = await context.Database.BeginTransactionAsync(...);

    // đọc dữ liệu → kiểm tra → thay đổi → SaveChanges

    await transaction.CommitAsync(cancellationToken);
    return result;
});
```

Nếu kết nối đứt giữa workflow, retry chỉ một câu lệnh riêng lẻ có thể tạo trạng thái nửa hoàn tất. Bọc cả unit of work giúp lần thử mới chạy lại từ đầu. Checkout đã có `CheckoutId` idempotent để xử lý trường hợp client không biết commit đầu tiên đã thành công hay chưa.

## Liveness và readiness

Hai endpoint được thêm:

```text
GET /health/live   → tiến trình ASP.NET còn hoạt động
GET /health/ready  → API kết nối được SQL Server
```

`live` không chạy database check. Nếu SQL tạm lỗi mà liveness cũng lỗi, orchestrator có thể liên tục restart một API vẫn khỏe và làm sự cố nặng hơn.

`ready` gọi `Database.CanConnectAsync`. Khi SQL không truy cập được, endpoint trả trạng thái unhealthy (`503` theo health-check middleware), nhờ đó load balancer ngừng gửi request mới tới instance đó.

Health response mặc định chỉ trả trạng thái ngắn, không trả connection string, exception hoặc thông tin credential ra ngoài.

## Connection string khi deploy

Không commit mật khẩu cloud vào `appsettings.json`. Production cung cấp cấu hình bằng secret của nền tảng hoặc environment variable:

```text
ConnectionStrings__DefaultConnection=Server=tcp:...;Database=...;User ID=...;Password=...;
```

Hai dấu gạch dưới ánh xạ thành `ConnectionStrings:DefaultConnection`. `CreateBuilder` hợp nhất nguồn cấu hình và environment variable ghi đè file JSON.

Production cần thêm:

- TLS và certificate validation phù hợp nhà cung cấp;
- firewall/private network chỉ cho app truy cập;
- user database có quyền tối thiểu;
- backup, point-in-time restore và cảnh báo dung lượng;
- migration chạy như một bước deploy có kiểm soát, không để mọi instance cùng tự migrate khi startup.

## Những gì đã kiểm tra

- Backend build không warning/error.
- `/health/live` trả `200 Healthy` mà không phụ thuộc database check.
- `/health/ready` trả `200 Healthy` với SQL Server local đang kết nối được.
- Checkout, Customer cancel và Admin status transaction vẫn đạt sau khi bật execution strategy.
- Các kiểm tra role, CSRF, note, filter, audit và hoàn kho vẫn đạt.
- Không đổi schema nên không có migration mới.

Bài này tạo nền tảng vận hành database cloud. Nó chưa triển khai một nhà cung cấp cụ thể; connection string, firewall và pipeline migration sẽ được cấu hình khi chọn môi trường deploy.
