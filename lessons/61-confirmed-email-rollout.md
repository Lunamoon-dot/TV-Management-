# Bài 61 — Rollout yêu cầu xác nhận email

## Vấn đề

Sau khi có endpoint xác nhận email, hệ thống vẫn cho account chưa xác nhận đăng nhập. Bật ngay cho toàn bộ database có thể khóa các account cũ được tạo trước khi tính năng tồn tại.

## Cách làm

`nothing/appsettings.json` có cờ:

```json
"Auth": {
  "RequireConfirmedEmail": false
}
```

`Program.cs` truyền cờ này vào `options.SignIn.RequireConfirmedEmail`. Khi giá trị là `true`, ASP.NET Identity trả `IsNotAllowed` cho account chưa xác nhận. `AuthController` chuyển kết quả đó thành HTTP 403; lỗi sai mật khẩu vẫn là 401 để không làm lộ thông tin tài khoản.

React hiển thị hướng dẫn gửi lại email khi nhận 403. Route `/confirm-email` đã có form resend từ bài 60.

## Quy trình bật production

1. Xác định account cũ chưa xác nhận và chuẩn bị thông báo hoặc quy trình hỗ trợ.
2. Kiểm tra resend/confirm hoạt động với email provider thật.
3. Đặt biến môi trường `Auth__RequireConfirmedEmail=true` ở production.
4. Theo dõi tỷ lệ 403 và hỗ trợ các account chưa hoàn tất.

Mặc định vẫn để `false` trong repository để migration/deploy không vô tình khóa người dùng hiện tại.
