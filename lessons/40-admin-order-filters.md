# Bài 40 — Tìm kiếm và lọc đơn hàng Admin

Danh sách tất cả đơn chỉ hữu ích khi dữ liệu còn ít. Admin thường cần các câu hỏi cụ thể:

- tìm đơn theo một phần email Customer;
- xem riêng đơn `Pending`;
- xem đơn chưa thanh toán;
- kết hợp cả ba điều kiện và phân trang kết quả.

## Query DTO

`AdminOrderQueryRequest` kế thừa `OrderQueryRequest` để giữ `Page` và `PageSize`, sau đó thêm:

```csharp
public string? Search { get; set; }
public OrderStatus? Status { get; set; }
public PaymentStatus? PaymentStatus { get; set; }
```

`Search` giới hạn 256 ký tự. Hai enum nullable biểu diễn “không lọc”; giá trị enum sai như `status=Unknown` bị model binding từ chối với `400`.

## Xây IQueryable từng bước

```csharp
var orders = _context.Orders.AsQueryable();

if (!string.IsNullOrEmpty(search))
    orders = orders.Where(order =>
        order.Customer.Email != null && order.Customer.Email.Contains(search));

if (query.Status is { } status)
    orders = orders.Where(order => order.Status == status);

if (query.PaymentStatus is { } paymentStatus)
    orders = orders.Where(order => order.PaymentStatus == paymentStatus);
```

Đây chưa phải ba lần query database. `IQueryable` đang xây một biểu thức; SQL chỉ chạy khi gặp `CountAsync` hoặc `ToListAsync`.

Thứ tự đúng:

```text
Where các bộ lọc
  → CountAsync tổng kết quả đã lọc
  → OrderBy
  → Skip/Take
  → Select DTO
  → ToListAsync
```

Nếu `CountAsync` chạy trước `Where`, UI sẽ báo tổng số toàn hệ thống trong khi bảng chỉ chứa kết quả lọc.

SQL Server local đang dùng collation không phân biệt hoa thường, vì vậy tìm một phần email bằng `Contains` cũng không phân biệt hoa thường. Hành vi này phụ thuộc collation của database, không phải `Contains` luôn có cùng quy tắc trên mọi hệ quản trị.

## React: draft và applied filters

Ô email dùng hai state:

- `draftSearch`: nội dung Admin đang gõ;
- `filters.search`: giá trị đã submit và đang được gửi lên API.

Nhờ vậy mỗi phím không tự phát một request. Hai select áp dụng ngay vì mỗi lần chọn là một quyết định hoàn chỉnh. Mỗi lần đổi filter đều reset về trang 1; phân trang và retry giữ nguyên bộ lọc đã áp dụng.

Axios bỏ các giá trị rỗng khỏi query string:

```text
/api/admin/orders?page=1&pageSize=20
/api/admin/orders?page=1&pageSize=20&search=gmail&status=Pending&paymentStatus=Unpaid
```

## Những gì đã kiểm tra

- Backend build không warning/error.
- Frontend 48 test, lint và production build đạt.
- Kết hợp email + trạng thái đơn + thanh toán trả đúng đơn.
- Bộ lọc không khớp trả `200` với `items = []` và `totalCount = 0`.
- Enum query không hợp lệ trả `400`.
- Phân quyền Admin và các nghiệp vụ note/status/cancel cũ vẫn đạt.

Bài này không đổi model hoặc schema nên không cần migration. Chưa thêm lọc ngày và sort tùy chọn; chỉ nên bổ sung khi màn hình vận hành thực sự cần.
