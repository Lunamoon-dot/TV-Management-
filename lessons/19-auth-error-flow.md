# Bài 19: Xử lý 401, 403 và quay lại trang cũ sau đăng nhập

## Mục tiêu

Ở bài trước, backend đã bảo vệ API quản trị bằng cookie auth, CSRF và role `Admin`. Bài này xử lý phần frontend khi auth thay đổi trong lúc người dùng đang thao tác.

Case thực tế:

```txt
Admin mở /products/1/edit
    ↓
Cookie hết hạn hoặc bị xóa
    ↓
Admin bấm Lưu
    ↓
Backend trả 401 Unauthorized
    ↓
React chuyển về /login
    ↓
Đăng nhập xong quay lại /products/1/edit
```

Đây là phần rất hay gặp ở app thật. Nó không thay thế bảo mật backend; nó chỉ làm trải nghiệm frontend dễ hiểu hơn.

## 401 khác 403 thế nào?

`401 Unauthorized` trong HTTP thường có nghĩa là: server chưa xác định được bạn là ai. Với app của mình, thường là chưa đăng nhập, cookie hết hạn, hoặc cookie không gửi lên được.

`403 Forbidden` nghĩa là server biết bạn là ai, nhưng bạn không có quyền làm việc đó. Ví dụ user thường đã đăng nhập nhưng không có role `Admin`.

Trong project hiện tại:

```txt
GET /api/products
    public

POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}
    cần đăng nhập
    cần role Admin
    cần CSRF token
```

Vì vậy khi submit form tạo/sửa:

```txt
400 -> dữ liệu sai, map lỗi vào field
401 -> phiên đăng nhập hết hạn, về login
403 -> đăng nhập rồi nhưng không có quyền Admin
404 -> sản phẩm không còn tồn tại
```

## Helper lỗi HTTP

File mới:

```txt
frontend/src/shared/api/errors.ts
```

Nó gom các câu hỏi lặp lại:

```ts
isAuthenticationError(error) // 401
isAuthorizationError(error)  // 403
isValidationError(error)     // 400
isNotFoundError(error)       // 404
```

Lý do tách file này: component không cần biết chi tiết `axios.isAxiosError(...)` ở khắp nơi. Component chỉ cần hỏi theo nghĩa nghiệp vụ.

## Vì sao cần markAnonymous?

Trong Zustand auth store có thêm:

```ts
markAnonymous: () => void
```

Khi request lưu TV trả 401, frontend biết session hiện tại không còn dùng được nữa. Nó cập nhật state về anonymous ngay, rồi điều hướng về login.

Flow:

```txt
PUT /api/products/1 -> 401
    ↓
markAnonymous()
    ↓
navigate('/login', { state: { from: '/products/1/edit', expired: true } })
```

`expired: true` chỉ để trang login hiện thông báo:

```txt
Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.
```

## Quay lại trang cũ sau login

`RequireAdmin` đã có đoạn:

```tsx
<Navigate to="/login" replace state={{ from: location.pathname }} />
```

Nghĩa là nếu user vào trang cần Admin nhưng chưa đăng nhập, React Router gửi kèm `from`.

Trang login đọc lại:

```ts
const from = location.state?.from
```

Đăng nhập xong:

```ts
navigate(getReturnPath(location), { replace: true })
```

Nếu `from` hợp lệ, quay lại trang cũ. Nếu không có hoặc không an toàn, quay về `/`.

## So với Express + React

Nếu bạn từng làm JWT ở Express, flow gần giống:

```txt
Axios request
    ↓
Backend trả 401 vì token hết hạn
    ↓
Client clear auth state
    ↓
Redirect login
    ↓
Login xong quay lại trang trước
```

Khác nhau là project này không dùng access token trong JS. Cookie auth nằm trong HttpOnly cookie, browser tự gửi cookie theo request. React không đọc được cookie đó, nên React phải hỏi backend qua `/api/auth/me` hoặc dựa vào response `401`.

## Điều quan trọng

Ẩn nút, chặn route, redirect login đều là UX frontend. Bảo mật thật vẫn nằm ở backend:

```csharp
[Authorize(Roles = AppRoles.Admin)]
[ValidateAntiForgeryToken]
```

Nếu ai đó tự gọi API bằng Postman/browser devtools, backend vẫn chặn đúng bằng `401`, `403` hoặc `400`.

## Tự kiểm tra

1. Mở trang sửa TV khi đã đăng nhập admin.
2. Xóa cookie `TvStore.Auth` trong browser hoặc đăng xuất ở tab khác.
3. Bấm lưu form.
4. App phải chuyển về `/login` và báo phiên hết hạn.
5. Đăng nhập lại.
6. App quay lại trang sửa TV cũ.

Nếu user thường không có role Admin cố vào `/products/new`, UI sẽ báo không có quyền; nếu tự gọi API tạo TV, backend trả `403`.
