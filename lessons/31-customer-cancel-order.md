# Bài 31 — Customer tự hủy đơn hàng

Customer giờ có thể hủy đơn ở trang `/orders/{id}` khi đơn còn `Pending`.

```text
POST /api/orders/{id}/cancel
  → lấy CustomerId từ cookie Identity
  → query Order theo cả Id và CustomerId
  → kiểm tra trạng thái Pending
  → hoàn lại Stock cho từng OrderItem
  → đổi trạng thái thành Cancelled
  → SaveChanges trong cùng transaction
```

## Quyền sở hữu nằm trong query

Backend không nhận `customerId` từ React. ID người dùng được lấy từ cookie đã xác thực, sau đó query:

```csharp
order.Id == id && order.CustomerId == currentUserId
```

Nếu đơn thuộc khách khác, API trả `404`. Cách này vừa chặn thao tác vừa không tiết lộ rằng mã đơn của người khác có tồn tại.

## Vì sao Customer chỉ hủy Pending?

- `Pending`: cửa hàng chưa xác nhận, Customer được tự hủy.
- `Confirmed`: Admin đã nhận xử lý; hiện chỉ Admin được hủy.
- `Shipped`, `Completed`, `Cancelled`: không thể đi thẳng sang Cancelled bằng endpoint này.

Đây là quy tắc nghiệp vụ của project, không phải quy tắc bắt buộc của ASP.NET.

## Dùng service khi nào?

Admin và Customer đều phải hoàn kho giống nhau. `OrderCancellationService` giữ một bản duy nhất của nghiệp vụ:

- transaction `Serializable`;
- tải OrderItems và Products;
- kiểm tra trạng thái;
- cộng lại stock;
- đổi trạng thái và lưu.

Controller vẫn chịu trách nhiệm HTTP và quyền truy cập. Service trả `Success`, `NotFound` hoặc `InvalidStatus`; controller ánh xạ thành `204`, `404` hoặc `400`.

Đây là lý do thực tế để tạo service: đã có nghiệp vụ dùng ở hai nơi. Không cần tạo repository hoặc nhiều layer chỉ để bọc EF Core.

## Frontend

Nút **Hủy đơn hàng** chỉ xuất hiện với trạng thái `Pending`. Sau xác nhận, Axios gửi POST kèm CSRF token. Thành công thì local state đổi sang `Cancelled`, badge cập nhật và nút biến mất. Backend vẫn kiểm tra lại trạng thái vì UI có thể cũ hoặc bị sửa.
