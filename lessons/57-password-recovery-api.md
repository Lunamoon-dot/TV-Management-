# Bài 57: backend quên mật khẩu và đặt lại mật khẩu

## Hai endpoint

Yêu cầu mã khôi phục:

```http
POST /api/auth/forgot-password
```

```json
{ "email": "customer@example.com" }
```

Đặt mật khẩu mới:

```http
POST /api/auth/reset-password
```

```json
{
  "email": "customer@example.com",
  "resetCode": "...",
  "newPassword": "newpassword2"
}
```

Cả hai endpoint đều anonymous vì người quên mật khẩu chưa đăng nhập được. Chúng vẫn yêu cầu CSRF và có rate limit 5 request trong 15 phút theo IP.

## Không tiết lộ tài khoản

`forgot-password` luôn trả `204 No Content` cho email hợp lệ về định dạng, bất kể email có trong database hay không:

```text
Email tồn tại       → tạo token, gửi email → 204
Email không tồn tại → không làm gì         → 204
```

Nếu trả 404 cho email không tồn tại, kẻ tấn công có thể thử một danh sách email và xác định ai có tài khoản trong hệ thống.

## Token của ASP.NET Identity

Backend gọi:

```csharp
GeneratePasswordResetTokenAsync(user)
ResetPasswordAsync(user, token, newPassword)
```

`AddDefaultTokenProviders()` đăng ký token provider cần thiết. Token được bảo vệ bằng Data Protection, không phải một mật khẩu tạm lưu vào bảng user. Backend mã hóa Base64 URL-safe trước khi giao cho email sender để mã có thể đi qua URL/JSON an toàn.

Khi reset thành công, Identity thay password hash và security stamp. Token cũ không nên được coi là dữ liệu có thể dùng lâu dài hay chia sẻ.

## Email giả lập trong Development

Project chưa chọn nhà cung cấp email. Trong Development, sender ghi một file JSON vào `.dev-emails/` gồm email, reset code và thời gian tạo để học/test toàn bộ luồng. Thư mục đã được gitignore.

Reset code là dữ liệu nhạy cảm. Cơ chế pickup file chỉ dùng local, không dùng trên staging/production và không commit file. Ngoài Development, sender hiện báo lỗi vào server log; trước deploy phải thay bằng provider email thật qua cấu hình/secret.

## Rate limiting

Policy `password-reset` giới hạn 5 request/15 phút theo IP để giảm spam email và thử token liên tục. Thông báo 429 dùng nội dung chung vì cùng callback đang phục vụ cả login và password recovery.

Rate limit theo IP trong memory phù hợp giai đoạn một instance. Khi chạy nhiều instance sau reverse proxy, cần trusted forwarded headers và rate-limit store/gateway phù hợp hạ tầng.

## Integration test SQL thật

Test xác nhận:

- Thiếu CSRF trả 400.
- Email không tồn tại và tồn tại đều trả 204.
- Email không tồn tại không tạo message.
- Development sender tạo reset code cho tài khoản thật.
- Reset code sai trả 400.
- Reset code đúng trả 204.
- Mật khẩu cũ hết hiệu lực; mật khẩu mới đăng nhập được.
- Tài khoản và email test được dọn sau khi chạy.

Frontend yêu cầu mã và form đặt lại mật khẩu sẽ được làm ở bài tiếp theo.

