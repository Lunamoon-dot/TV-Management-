# Bài 58: giao diện React phục hồi mật khẩu

## Routes

```text
/forgot-password
/reset-password?email=...&code=...
```

Trang login có link “Quên mật khẩu?” tới route đầu tiên. Cả hai route đều public vì người mất mật khẩu chưa thể đăng nhập.

## Yêu cầu khôi phục

Form email dùng Zod kiểm tra định dạng rồi gọi Axios với CSRF:

```text
email → POST /api/auth/forgot-password → 204
```

Sau mọi response 204, UI chỉ hiện:

> Nếu email thuộc một tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.

UI không xác nhận email có tồn tại. Đây là phần frontend của cơ chế chống dò tài khoản đã làm ở backend.

## Đặt mật khẩu mới

Trang reset đọc `email` và `code` từ query string một lần. Form có mật khẩu mới, nhập lại mật khẩu và toggle hiện/ẩn độc lập. Zod kiểm tra:

- Link có email và reset code.
- Email đúng định dạng.
- Mật khẩu mới dài 8–128 ký tự, có chữ thường và số.
- Hai lần nhập khớp nhau.

Schema transform bỏ `confirmNewPassword` trước khi gửi API.

## Xóa token khỏi thanh địa chỉ

Ngay sau khi đọc query, trang gọi `history.replaceState` để URL trở thành:

```text
/reset-password
```

Token vẫn nằm trong state của component cho request hiện tại, nhưng không tiếp tục xuất hiện trên thanh địa chỉ. Việc này giảm khả năng token bị lưu trong lịch sử hoặc bị gửi qua referrer nếu người dùng mở liên kết khác.

## Development email

File email local giờ có thêm `ResetPath`, ví dụ:

```text
/reset-password?email=customer%40example.com&code=...
```

Khi test local, ghép path này sau `http://localhost:5173`. Production email provider sau này sẽ tạo absolute URL dựa trên public origin đã cấu hình; không hardcode localhost vào backend.

## Xử lý kết quả

- Thành công: xóa mật khẩu khỏi state và hiện link đăng nhập.
- `400`: link hết hạn/đã dùng hoặc mật khẩu không hợp lệ.
- `429`: báo gửi quá nhiều yêu cầu.
- Lỗi khác: hiện correlation ID nếu response có cung cấp.

## Kiểm tra

- Ba schema tests cho normalize email, loại confirmation và từ chối password sai.
- Frontend đạt 60 test, lint sạch và production build.
- Browser test xác nhận forgot form, invalid-link state, valid-link form và token biến mất khỏi URL.

