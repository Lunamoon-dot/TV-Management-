# Bài 21 — Tạo đơn hàng thật ở backend

Giỏ hàng ở bài 20 chỉ là trạng thái tạm trong React. Khi khách nhấn đặt hàng, frontend sẽ chỉ gửi danh sách `productId` và `quantity`. Frontend không được quyết định giá và tổng tiền vì người dùng có thể sửa request trong DevTools.

```text
React cart
  POST /api/orders { items: [{ productId, quantity }] }
        ↓
ASP.NET bind JSON → CreateOrderRequest và validate
        ↓
Cookie xác định CustomerId hiện tại
        ↓
SQL đọc Product + Brand, kiểm tra tồn kho, lấy giá thật
        ↓
Transaction: tạo Order + OrderItem và trừ Stock
        ↓
Commit tất cả hoặc rollback tất cả
```

## 1. Hai bảng mới

`Order` là phần đầu đơn hàng: khách nào mua, thời điểm tạo và tổng tiền. `OrderItem` là từng dòng TV trong đơn: sản phẩm, số lượng và giá tại thời điểm mua.

`OrderItem` lưu thêm `ProductName`, `BrandName` và `UnitPrice` dưới dạng snapshot. Nếu tháng sau quản trị viên đổi tên hoặc giá TV, hóa đơn cũ vẫn phải giữ đúng nội dung lúc khách đặt.

Quan hệ chính:

- Một `ApplicationUser` có nhiều `Order`.
- Một `Order` có nhiều `OrderItem`.
- Một `Product` có thể xuất hiện trong nhiều `OrderItem`.
- Xóa Order sẽ xóa các dòng của nó; xóa Product đang được tham chiếu bị chặn để bảo toàn lịch sử.

## 2. DTO mà client được gửi

Client chỉ gửi:

```json
{
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

`CreateOrderRequest` yêu cầu từ 1 đến 50 dòng. Mỗi dòng cần `productId > 0` và `quantity` từ 1 đến 100. `[ApiController]` tự trả 400 trước khi action chạy nếu DTO không hợp lệ.

Không nhận `customerId`, `unitPrice`, `lineTotal` hay `totalAmount` từ body:

- Customer lấy từ cookie đăng nhập bằng `UserManager.GetUserAsync(User)`.
- Giá lấy từ `Products` trong SQL Server.
- Thành tiền và tổng tiền do backend tính.

Đây là ranh giới tin cậy quan trọng: Zod giúp UX ở React, còn backend vẫn phải tự xác thực mọi dữ liệu.

## 3. Transaction phục vụ việc gì?

Một lần đặt hàng thay đổi nhiều dữ liệu: thêm Order, thêm các OrderItem và giảm Stock của nhiều Product. Nếu một thao tác lỗi, database phải hủy toàn bộ. Không được có trường hợp đã tạo đơn nhưng chưa trừ kho, hoặc đã trừ một TV rồi lỗi ở TV kế tiếp.

Controller dùng transaction với `IsolationLevel.Serializable`. Mức này buộc các giao dịch cạnh tranh thực hiện như lần lượt đối với dữ liệu liên quan, giúp tránh hai khách cùng đọc lượng tồn kho cũ rồi cùng mua vượt số lượng. Đổi lại, transaction có thể khóa lâu hơn; vì vậy code chỉ làm truy vấn và ghi cần thiết rồi commit ngay.

Luồng trong action:

1. Gộp các dòng trùng `productId`.
2. Bắt đầu transaction.
3. Tải tất cả Product cần mua cùng Brand.
4. Kiểm tra sản phẩm tồn tại và đủ Stock.
5. Tạo snapshot `OrderItem`, tính tổng và giảm Stock trên entity đang được EF tracking.
6. `SaveChangesAsync` ghi tất cả thay đổi.
7. `CommitAsync` xác nhận transaction.

Nếu action trả lỗi trước commit hoặc có exception, transaction bị dispose và SQL Server rollback.

## 4. Response 201

Khi thành công, API trả `201 Created` cùng đơn vừa tạo, gồm mã đơn, thời gian, tổng tiền và các dòng hàng. Giá trị trả về chính là giá đã được server xác nhận, không phải tổng tạm tính trong giỏ React.

Hiện endpoint yêu cầu đăng nhập và CSRF:

- Không có cookie hợp lệ: 401.
- Có cookie nhưng thiếu/sai CSRF token: 400.
- DTO hoặc sản phẩm/tồn kho không hợp lệ: 400.
- Thành công: 201 và tồn kho trong SQL đã giảm.

## 5. Phần chưa nối ở bài này

Nút `Đặt hàng` trong React chưa gọi endpoint. Bài tiếp theo sẽ nối CartPage với `POST /api/orders`, lấy CSRF token, xử lý 401/400, clear giỏ chỉ khi nhận 201 và chuyển sang trang xác nhận đơn hàng.
