# Bài 59: backend xác nhận email

## Triển khai theo hai giai đoạn

Bài này tạo và xác nhận email token, nhưng chưa bật `RequireConfirmedEmail`. Lý do là các tài khoản được tạo trước tính năng này đang có `EmailConfirmed = false`; bật ngay sẽ khóa Customer/Admin hiện có.

```text
Bài 59: tạo thư + xác nhận + kiểm tra dữ liệu
Bài sau: giao diện React
Sau đó: xử lý account cũ rồi mới bắt buộc xác nhận khi login
```

Đây là cách rollout thay đổi auth an toàn: chuẩn bị luồng mới trước khi bật policy có khả năng chặn người dùng.

## Luồng đăng ký

Sau khi `UserManager.CreateAsync` thành công:

```text
GenerateEmailConfirmationTokenAsync
  → Base64Url encode
  → IEmailConfirmationSender
  → 201 Created
```

Lỗi gửi email được ghi vào server log nhưng không xóa tài khoản vừa tạo. Người dùng có thể yêu cầu gửi lại sau.

## Endpoints

Gửi lại thư:

```http
POST /api/auth/send-confirmation-email
```

Xác nhận:

```http
POST /api/auth/confirm-email
```

Cả hai đều anonymous, yêu cầu CSRF và chịu rate limit `account-email` 5 request/15 phút/IP.

Endpoint gửi lại luôn trả 204 cho email đúng định dạng:

```text
Không có tài khoản → 204, không gửi
Đã xác nhận        → 204, không gửi
Chưa xác nhận      → 204, gửi thư
```

Response giống nhau giúp tránh dò tài khoản và trạng thái xác nhận.

## EmailConfirmationService

Việc generate/encode/send token được đặt trong service dùng chung vì cả đăng ký và resend đều cần cùng một quy trình. Controller chỉ xử lý HTTP và quyết định khi nào gọi service.

Đây là ví dụ phù hợp để tách service: logic đã có hai caller thật, không phải tạo abstraction dự phòng.

## Development delivery

Development tạo file `email-confirmation-*.json` trong `.dev-emails/` với:

- Email.
- ConfirmationCode.
- ConfirmationPath.
- CreatedAt.

Production sender hiện báo lỗi có cấu trúc và vẫn cần thay bằng email provider thật trước deploy. Token không được log hoặc commit.

## Integration test SQL thật

Test xác nhận:

- Đăng ký tạo confirmation message.
- Tài khoản mới có `EmailConfirmed = false`.
- Resend thiếu CSRF bị chặn.
- Email không tồn tại và tồn tại cùng trả 204.
- Chỉ tài khoản thật/chưa xác nhận tạo message.
- Code sai trả 400.
- Code đúng trả 204 và SQL chuyển `EmailConfirmed = true`.
- Tài khoản đã xác nhận đăng nhập được.

Login chưa yêu cầu confirmed email trong bài này.

