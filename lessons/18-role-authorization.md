# Bài 18 — Role `Admin`: ai được quản lý catalog?

Màn hình danh sách TV là phần dành cho khách nên mọi người đều đọc được. Thêm, sửa và xoá TV là nghiệp vụ quản trị, nên server phải kiểm tra tài khoản có role `Admin` trước khi chạy action.

## Luồng khi Admin sửa một TV

```text
React gọi PUT /api/products/8
    ↓ kèm cookie đăng nhập + X-CSRF-TOKEN
ASP.NET đọc cookie, tạo User claims
    ↓
[Authorize(Roles = "Admin")] kiểm tra claim role
    ↓
ValidateAntiForgeryToken kiểm tra request đến từ UI hợp lệ
    ↓
ProductsController.Update → EF Core → SQL Server
```

`[Authorize]` và `[ValidateAntiForgeryToken]` chạy **trước thân hàm** `Update`. Vì vậy biến `request` và query EF sẽ không được dùng nếu request không qua được lớp bảo vệ.

| Tình huống | Kết quả |
|---|---|
| Chưa đăng nhập, gọi POST/PUT/DELETE | `401 Unauthorized` |
| Đã đăng nhập nhưng không có Admin | `403 Forbidden` |
| Admin nhưng thiếu CSRF token | `400 Bad Request` |
| Admin có cookie và token hợp lệ | Action tiếp tục chạy |

`401` nghĩa là chưa xác thực danh tính. `403` nghĩa là server biết bạn là ai, nhưng vai trò không được phép làm việc đó.

## Code server

`Features/Auth/AppRoles.cs` giữ tên role tại một nơi:

```csharp
public static class AppRoles
{
    public const string Admin = "Admin";
}
```

Ba action mutation trong `Controllers/ProductsController.cs` đều có:

```csharp
[Authorize(Roles = AppRoles.Admin)]
[ValidateAntiForgeryToken]
[HttpPut("{id:int}")]
public async Task<IActionResult> Update(...) { ... }
```

GET không gắn `Authorize`, nên catalog vẫn public. Không được chỉ ẩn nút ở React: người dùng có thể tự gửi HTTP request bằng DevTools, Postman, hoặc một app khác.

## Tạo Admin local mà không commit mật khẩu

Project đã bật User Secrets. Giá trị trong User Secrets nằm ngoài source và không lên Git.

Nếu bạn muốn nâng **tài khoản đã đăng ký** thành Admin, thay `email-cua-ban` bằng email thật rồi chạy tại thư mục gốc project:

```powershell
dotnet user-secrets set --project nothing/nothing.csproj "BootstrapAdmin:Email" "email-cua-ban@example.com"
```

Sau đó dừng và chạy lại API. `DevelopmentAdminSeeder` chỉ chạy khi `Development`, tìm tài khoản này và gán role `Admin`. Hãy đăng xuất rồi đăng nhập lại để cookie mới chứa role mới.

Nếu tài khoản chưa tồn tại, đặt thêm password trước khi chạy API:

```powershell
dotnet user-secrets set --project nothing/nothing.csproj "BootstrapAdmin:Email" "admin-local@example.com"
dotnet user-secrets set --project nothing/nothing.csproj "BootstrapAdmin:Password" "MotMatKhauLocalManh!2026"
```

Sau khi bootstrap xong, xoá secrets để tránh một lần chạy sau vô tình cấp quyền cho tài khoản được tạo lại:

```powershell
dotnet user-secrets remove --project nothing/nothing.csproj "BootstrapAdmin:Email"
dotnet user-secrets remove --project nothing/nothing.csproj "BootstrapAdmin:Password"
```

Seeder không chạy ở Production. Khi deploy, việc tạo role/Admin sẽ dùng quy trình quản trị đã kiểm soát, không dùng password trong `appsettings.json`.

## React dùng role thế nào?

`GET /api/auth/me` trả về `roles`. Hàm `isAdmin` kiểm tra mảng này để:

- chỉ hiện “Thêm TV” và “Sửa TV” cho Admin;
- chặn route `/products/new` và `/products/:id/edit` ở giao diện;
- gửi CSRF token cho POST/PUT qua `shared/api/csrf.ts`.

Đây là trải nghiệm người dùng; server vẫn là nơi quyết định cuối cùng.

## Tự kiểm tra

1. Không đăng nhập, mở `POST /api/products`: nhận `401`.
2. Đăng ký một account thường, đăng nhập, gửi POST với CSRF token: nhận `403`.
3. Bootstrap email của bạn thành Admin, đăng nhập lại, mở `/api/auth/me`: `roles` có `Admin`.
4. Vào React: link “Thêm TV” và “Sửa TV” xuất hiện. Tạo hoặc sửa TV thành công.
5. Thử bỏ `X-CSRF-TOKEN` trong request Admin: nhận `400`.

Trong phiên triển khai, các kiểm tra 1, 3, 5 đã chạy với SQL Server local. Tài khoản Admin kiểm tra tạm đã được xoá; role `Admin` được giữ lại vì đó là dữ liệu cấu hình hợp lệ.
