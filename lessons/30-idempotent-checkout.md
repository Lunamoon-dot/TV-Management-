# Bài 30 — Chống tạo đơn trùng bằng idempotency key

Một request tạo đơn có thể đã được backend lưu thành công nhưng response bị mất do mạng. Nếu client gửi lại request, server không được tạo đơn thứ hai và trừ kho thêm lần nữa.

## CheckoutId hoạt động thế nào?

React tạo một UUID khi trang giỏ hàng được mở:

```ts
const checkoutId = useRef(crypto.randomUUID())
```

Mọi lần thử lại của checkout đó gửi cùng `checkoutId`. Backend tìm đơn bằng cặp:

```text
(CustomerId, CheckoutId)
```

- Chưa có đơn: backend kiểm tra sản phẩm, trừ kho và tạo đơn.
- Đã có đơn: backend trả lại chính đơn cũ, không chạy lại nghiệp vụ.

`useRef` phù hợp vì render lại component không tạo UUID mới. UUID này không phải secret và không dùng để xác thực; cookie Identity vẫn xác định Customer.

## Vì sao vẫn cần unique index?

Câu kiểm tra trong C# giúp xử lý retry bình thường, nhưng hai request có thể tới gần như cùng lúc. SQL có unique filtered index trên `(CustomerId, CheckoutId)` để dữ liệu không thể chứa hai đơn có cùng khóa checkout của một khách hàng.

`CheckoutId` nullable trên entity để các đơn cũ trước migration vẫn hợp lệ. DTO lại từ chối `Guid.Empty`, nên mọi đơn mới đều phải có khóa.

## Response lần đầu và lần gửi lại

- Lần tạo mới trả `201 Created`.
- Lần gửi lại trả `200 OK` với cùng `OrderResponse`.

Frontend chỉ cần nhận được đơn và chuyển đến `/orders/{id}` trong cả hai trường hợp.

## Phạm vi hiện tại

Cơ chế này bảo vệ một lần checkout và đã được integration test bằng cách gửi cùng request hai lần. Chưa có cơ chế giữ key qua việc đóng tab hoặc khởi động lại browser trước khi nhận response; khi cần, có thể persist checkout attempt trong session storage.
