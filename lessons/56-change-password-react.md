# Bài 56: giao diện React đổi mật khẩu

## Vị trí giao diện

Form đổi mật khẩu nằm dưới form thông tin giao hàng tại:

```text
/account/profile
```

Route này đã được bảo vệ bởi `RequireAuthenticated`. Người chưa đăng nhập được chuyển về trang login.

## Ba trường trên frontend

```text
currentPassword
newPassword
confirmNewPassword
```

`confirmNewPassword` giúp phát hiện nhập sai ngay trên client. Sau khi Zod xác nhận hai mật khẩu mới khớp nhau, schema transform request còn:

```json
{
  "currentPassword": "...",
  "newPassword": "..."
}
```

Backend không cần nhận trường xác nhận vì nó không tạo thêm giá trị bảo mật nào.

## Validation hai lớp

Zod kiểm tra trước khi gửi:

- Mật khẩu hiện tại không trống.
- Mật khẩu mới dài 8–128 ký tự.
- Có ít nhất một chữ thường và một chữ số.
- Hai lần nhập mật khẩu mới phải khớp.

ASP.NET Identity vẫn kiểm tra lại password policy và mật khẩu hiện tại. Zod chỉ cải thiện trải nghiệm; nó không phải lớp bảo mật cuối cùng.

## Không trim mật khẩu

Email, họ tên và địa chỉ có thể trim khoảng trắng ở hai đầu. Mật khẩu phải được giữ nguyên vì khoảng trắng có thể là ký tự do người dùng chủ động đặt. Tự trim sẽ làm chuỗi được gửi khác với chuỗi họ đã nhập.

## Hiện và ẩn mật khẩu

Mỗi ô có state hiện/ẩn riêng. Nút dùng `type="button"` để không vô tình submit form và có `aria-label`, `aria-pressed` cho accessibility.

## Gửi request

```text
submit
  → Zod safeParse
  → GET CSRF token
  → PUT /api/account/password
  → 204
  → xóa sạch ba ô và ẩn mật khẩu
```

Nếu backend trả validation problem, lỗi được ánh xạ về `currentPassword` hoặc `newPassword`. Nếu cookie hết hạn, auth store chuyển anonymous và trang điều hướng về login.

## Kiểm tra

- Schema loại trường xác nhận khỏi API request.
- Schema từ chối mật khẩu yếu hoặc nhập lại không khớp.
- Frontend đạt 57 test.
- Lint sạch và production build thành công.

