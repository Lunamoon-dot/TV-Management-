# Bài 52: hồ sơ khách hàng và địa chỉ mặc định ở backend

## Mục tiêu nghiệp vụ

Customer thường phải nhập lại tên, số điện thoại và địa chỉ ở mỗi lần checkout. Ta bắt đầu bằng một hồ sơ mặc định gắn với tài khoản:

```text
Identity user
├── Email
├── FullName
├── PhoneNumber
└── ShippingAddress
```

Bài này làm backend và database. Bài tiếp theo sẽ tạo giao diện React và dùng dữ liệu này để điền sẵn checkout.

## Tận dụng ApplicationUser

`ApplicationUser` kế thừa `IdentityUser`, vốn đã có `PhoneNumber`. Vì vậy chỉ thêm:

```csharp
public string? FullName { get; set; }
public string? ShippingAddress { get; set; }
```

Không tạo bảng Profile riêng ở giai đoạn này vì mỗi tài khoản chỉ cần một hồ sơ mặc định và chưa có nhu cầu nhiều địa chỉ. Khi cần address book, ta sẽ thêm entity địa chỉ riêng thay vì nhồi nhiều cột lặp vào user.

## Vì sao các cột nullable?

Tài khoản hiện có chưa từng nhập hồ sơ. Migration thêm cột nullable để bảo toàn dữ liệu và cho phép user hoàn thiện sau:

```text
FullName         nvarchar(100) null
PhoneNumber      nvarchar(20)  null
ShippingAddress  nvarchar(300) null
```

PUT yêu cầu đủ ba field. Nullable ở database phục vụ trạng thái “chưa thiết lập”, còn request cập nhật hoàn chỉnh vẫn có validation chặt.

## API

### Đọc hồ sơ

```http
GET /api/account/profile
```

Yêu cầu cookie đăng nhập. Backend lấy user từ `User`, không nhận `userId` từ URL/query/body.

Response của tài khoản mới:

```json
{
  "email": "customer@example.com",
  "fullName": null,
  "phoneNumber": null,
  "shippingAddress": null
}
```

### Cập nhật hồ sơ

```http
PUT /api/account/profile
X-CSRF-TOKEN: ...
Content-Type: application/json
```

```json
{
  "fullName": "Nguyen Van Huy",
  "phoneNumber": "0901234567",
  "shippingAddress": "123 Duong Test, Quan 1"
}
```

DTO kiểm tra:

- tên 2–100 ký tự;
- số điện thoại 8–20 ký tự và chỉ chứa nhóm ký tự điện thoại cho phép;
- địa chỉ 10–300 ký tự.

Server trim dữ liệu rồi gọi `UserManager.UpdateAsync`. Response 200 trả hồ sơ mới.

## Quyền sở hữu

Luồng xác định user:

```text
Cookie TvStore.Auth
       ↓
Authentication middleware tạo User principal
       ↓
UserManager.GetUserAsync(User)
       ↓
ApplicationUser của chính request hiện tại
```

Client không thể đổi ID để đọc/sửa hồ sơ người khác vì endpoint không nhận ID.

## Hồ sơ và snapshot đơn hàng

Profile là giá trị mặc định cho lần checkout sau. `Order.RecipientName`, `PhoneNumber` và `ShippingAddress` vẫn là snapshot:

```text
Profile hiện tại → điền form checkout → tạo Order snapshot
```

Nếu Customer sửa profile sau đó, đơn cũ không thay đổi. Điều này giữ đúng lịch sử giao hàng.

## Migration

Migration `AddCustomerProfile` đã được review trước khi apply. Database có hai tài khoản cũ và không có `PhoneNumber` dài quá 20, nên việc thu hẹp cột không cắt dữ liệu.

## Kiểm chứng

`tests/customer-profile.ps1` xác nhận:

- anonymous nhận 401;
- account mới đọc đúng profile rỗng;
- PUT thiếu CSRF nhận 400;
- dữ liệu sai nhận 400;
- dữ liệu hợp lệ được trim và trả 200;
- user khác không thấy profile của owner;
- giá trị được lưu thật trong SQL Server;
- account test được dọn sau kiểm tra.

Release build và 12 backend unit tests vẫn đạt.
