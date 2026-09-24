# Bài 55: đổi mật khẩu bằng ASP.NET Identity

## Mục tiêu

Customer đã đăng nhập có thể đổi mật khẩu qua:

```http
PUT /api/account/password
```

Request gồm:

```json
{
  "currentPassword": "mat-khau-hien-tai",
  "newPassword": "mat-khau-moi"
}
```

Endpoint yêu cầu cookie đăng nhập và CSRF token. Client không gửi userId; backend lấy đúng user từ `HttpContext.User`.

## Identity xử lý gì?

Controller gọi:

```csharp
await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
```

Identity thực hiện các bước quan trọng:

1. Kiểm tra hash của mật khẩu hiện tại.
2. Kiểm tra mật khẩu mới theo password policy đã cấu hình.
3. Tạo hash mới; ứng dụng không lưu mật khẩu dạng rõ.
4. Cập nhật security stamp của tài khoản.

Không tự lấy `PasswordHash`, không tự so sánh chuỗi và không tự viết thuật toán hash.

## Vì sao gọi RefreshSignInAsync?

Đổi mật khẩu làm thay đổi thông tin bảo mật của user. Sau khi thành công, controller gọi:

```csharp
await _signInManager.RefreshSignInAsync(user);
```

Lệnh này phát hành lại cookie cho phiên hiện tại theo dữ liệu Identity mới. Người dùng đổi mật khẩu thành công vẫn tiếp tục đăng nhập trên thiết bị đang dùng.

Điều này không có nghĩa mọi cookie trên thiết bị khác bị thu hồi tức thì. Việc kiểm tra security stamp theo chu kỳ hoặc quản lý session tập trung là một bài riêng nếu sản phẩm cần chức năng “đăng xuất mọi thiết bị”.

## Validation và lỗi

- DTO giới hạn chuỗi ở 128 ký tự và mật khẩu mới tối thiểu 8 ký tự.
- Identity tiếp tục kiểm tra yêu cầu chữ thường và chữ số.
- `PasswordMismatch` được gắn vào `CurrentPassword`.
- Các lỗi password policy được gắn vào `NewPassword`.
- Response thành công là `204 No Content`.

Frontend sẽ có trường nhập lại mật khẩu mới, nhưng trường xác nhận không cần gửi tới backend. Nó chỉ giúp phát hiện người dùng gõ sai trước khi request được gửi, tương tự form đăng ký hiện tại.

## Integration test SQL thật

Test đã xác nhận:

- Thiếu CSRF trả 400.
- Sai mật khẩu hiện tại trả 400.
- Mật khẩu mới không đạt policy trả 400.
- Đổi hợp lệ trả 204.
- Cookie hiện tại vẫn hợp lệ sau refresh.
- Mật khẩu cũ đăng nhập thất bại.
- Mật khẩu mới đăng nhập thành công.

Tài khoản thử nghiệm được xóa sau test.

