# Bài 60: giao diện xác nhận email

## Route

```text
/confirm-email?email=...&code=...
```

Đăng ký xong chuyển tới `/confirm-email?email=...` để người dùng biết cần kiểm tra email. Link trong Development message có thêm `code`, nên trang tự gửi request xác nhận.

## Hai trạng thái của cùng một trang

- Không có code: hiện email và nút gửi lại.
- Có code: tự gọi `POST /api/auth/confirm-email`, sau đó hiện thành công hoặc lỗi link.

Email không tồn tại và email đã xác nhận vẫn nhận thông báo chung khi gửi lại, khớp với backend chống enumeration.

## Xóa token khỏi URL

Trang đọc query một lần vào state rồi dùng `history.replaceState` để URL trở thành `/confirm-email`. Confirmation code vẫn được dùng cho request hiện tại nhưng không nằm lại trong thanh địa chỉ/history.

## Luồng đăng ký mới

```text
React register
  → POST /api/auth/register
  → Identity tạo user + backend gửi confirmation message
  → React chuyển /confirm-email?email=...
  → user mở link email
  → POST /api/auth/confirm-email
  → EmailConfirmed = true
```

Login chưa bị chặn khi EmailConfirmed là false; việc bật policy được giữ ở bài rollout sau để xử lý account cũ an toàn.

## Kiểm tra

- Schema test email trim và confirmation code bắt buộc.
- Frontend đạt 62 test, lint sạch, production build.
- Route có code hiện trạng thái xác nhận; route thiếu code hiện form gửi lại.

