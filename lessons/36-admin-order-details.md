# Bài 36 — Trang chi tiết đơn hàng cho Admin

Trang danh sách đơn chỉ cần dữ liệu tóm tắt như mã đơn, email khách hàng, trạng thái và tổng tiền. Khi Admin chọn một đơn, trang chi tiết mới tải địa chỉ giao hàng, dấu vết thanh toán và từng sản phẩm.

```text
/admin/orders
  → GET /api/admin/orders?page=1&pageSize=20
  → nhiều AdminOrderResponse nhỏ

/admin/orders/123
  → GET /api/admin/orders/123
  → một AdminOrderDetailsResponse đầy đủ
```

## Vì sao dùng hai response DTO?

Nếu nhét `Items` và địa chỉ vào response danh sách, một trang 20 đơn phải tải toàn bộ các dòng sản phẩm dù bảng không hiển thị chúng. Tách DTO giúp contract của mỗi endpoint đúng với nhu cầu màn hình và tránh dữ liệu thừa.

`AdminOrderDetailsResponse` chứa:

- thông tin đơn và email Customer;
- snapshot người nhận, số điện thoại, địa chỉ;
- trạng thái xử lý và thanh toán;
- thời điểm/email Admin xác nhận thanh toán;
- danh sách `OrderItemResponse` và tổng tiền.

Đây là DTO trả ra client, không trả trực tiếp EF entity `Order`.

## Projection từ EF Core

Controller dùng `Select` để mô tả đúng dữ liệu cần trả:

```csharp
var order = await _context.Orders
    .Where(order => order.Id == id)
    .Select(order => new AdminOrderDetailsResponse
    {
        Id = order.Id,
        CustomerEmail = order.Customer.Email ?? string.Empty,
        Items = order.Items
            .OrderBy(item => item.Id)
            .Select(item => new OrderItemResponse { /* snapshot fields */ })
            .ToList()
    })
    .FirstOrDefaultAsync(cancellationToken);
```

EF Core dịch projection này thành SQL. Không cần `Include` rồi mới map toàn bộ entity trong memory. Đây là truy vấn chỉ đọc nên EF cũng không cần theo dõi entity để `SaveChanges`.

Không có đơn tương ứng thì API trả `404`. Toàn controller đã có `[Authorize(Roles = AppRoles.Admin)]`, vì vậy Customer nhận `403` cho cả danh sách lẫn chi tiết.

## Luồng React

Mã đơn trong bảng là `Link` tới `/admin/orders/:id`. Trang chi tiết:

1. đọc `id` từ URL;
2. kiểm tra đó là số nguyên dương;
3. gọi Axios `GET /admin/orders/{id}`;
4. render loading, lỗi, không tìm thấy hoặc dữ liệu thành công;
5. hiển thị snapshot sản phẩm đã mua thay vì dữ liệu catalog hiện tại.

Snapshot rất quan trọng: nếu tên hoặc giá TV thay đổi sau khi đặt hàng, lịch sử đơn vẫn phải giữ đúng tên và giá lúc mua.

## Những gì đã kiểm tra

- Backend build không warning/error.
- Customer gọi chi tiết Admin nhận `403`.
- Admin đọc đúng email, giao hàng và item của đơn.
- Các quy tắc đổi/hủy trạng thái cũ vẫn đạt.
- Frontend có 44 test đạt, lint sạch và production build thành công.

Bài này không đổi schema nên không cần migration. Bước tiếp theo hợp lý là thêm lịch sử chuyển trạng thái đơn để Admin theo dõi quá trình xử lý, ở mức tối thiểu trước.
