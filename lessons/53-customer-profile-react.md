# Bài 53: giao diện hồ sơ khách hàng bằng React

## Kết quả

Customer đã đăng nhập có thể mở:

```text
/account/profile
```

Email trên thanh điều hướng là liên kết dẫn tới trang này. Route được bọc bằng `RequireAuthenticated`, nên khách chưa đăng nhập được chuyển tới `/login` và quay lại hồ sơ sau khi đăng nhập.

## Luồng tải dữ liệu

```text
ProfilePage mount
  → GET /api/account/profile bằng Axios
  → backend đọc user từ cookie
  → trả email và thông tin giao hàng
  → React đưa dữ liệu vào form
```

Email chỉ đọc vì đổi email là một quy trình bảo mật riêng. Ba trường có thể sửa là họ tên, số điện thoại và địa chỉ giao hàng mặc định.

## Luồng lưu

```text
User submit form
  → Zod kiểm tra và trim dữ liệu
  → lấy CSRF token
  → PUT /api/account/profile
  → DTO backend kiểm tra lần nữa
  → UserManager lưu SQL Server
  → response mới cập nhật lại form
```

Zod giúp phản hồi ngay trên trình duyệt. DTO backend vẫn bắt buộc vì client có thể bị bỏ qua hoặc request có thể được gửi bằng công cụ khác.

## Vì sao form không dùng Zustand?

Form chỉ tồn tại trong một trang và không cần dùng chung. `useState` là đủ và giữ code đơn giản. Zustand vẫn phù hợp với state dùng ở nhiều nơi hoặc phải sống qua nhiều màn hình, như session, cart và catalog filters.

## Tổ chức theo feature

```text
features/account/
├── api/profile.ts
├── pages/ProfilePage.tsx
├── schemas/profile.ts
├── schemas/profile.test.ts
└── types.ts
```

API, schema, type và page nằm cùng feature nghiệp vụ `account`. Đây là feature-folder organization, không phải gom tất cả DTO hoặc tất cả page của toàn ứng dụng vào một thư mục lớn.

## Xử lý lỗi

- `401`: xóa session phía client và chuyển về login.
- `400`: báo dữ liệu không hợp lệ; frontend đã chặn các lỗi thông thường bằng Zod.
- Lỗi khác: hiển thị thông báo và correlation ID nếu server trả về.
- Request GET bị hủy khi rời trang để tránh cập nhật component đã unmount.

## Kiểm tra

- Hai test Zod: dữ liệu hợp lệ được trim, dữ liệu sai bị từ chối.
- Frontend có tổng cộng 53 test đạt.
- Lint sạch và production build thành công.
- Browser test xác nhận người chưa đăng nhập vào `/account/profile` được chuyển tới `/login`.

Tiếp theo có thể dùng hồ sơ này để điền sẵn form checkout, nhưng vẫn lưu snapshot giao hàng riêng trong mỗi đơn hàng.

