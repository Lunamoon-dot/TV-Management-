# Bài 45: Data Protection keys của cookie đăng nhập

## Cookie được bảo vệ bằng gì?

Sau khi Identity đăng nhập, ASP.NET tạo authentication cookie. Cookie không chứa mật khẩu nhưng chứa ticket xác thực được **mã hóa và ký** bằng ASP.NET Core Data Protection.

```text
Identity tạo authentication ticket
              ↓
Data Protection bảo vệ bằng key
              ↓
Browser nhận cookie TvStore.Auth
              ↓ request sau
Server dùng cùng key để đọc và kiểm tra cookie
```

Nếu server không còn key cũ, cookie vẫn nằm trong browser nhưng backend không giải mã được. Người dùng bị xem như chưa đăng nhập.

## Vì sao local thường không thấy lỗi?

Ở Development, ASP.NET tự lưu key theo hồ sơ người dùng trên máy phát triển. Vì vậy chạy lại ứng dụng thường vẫn đọc được cookie cũ.

Container hoặc server Production có thể dùng filesystem tạm. Khi redeploy/restart, thư mục đó bị thay và key mất. Với nhiều instance, mỗi máy tự tạo key riêng còn khiến cookie do máy A phát hành không đọc được ở máy B.

## Cấu hình đã thêm

Ứng dụng dùng application name cố định:

```csharp
builder.Services.AddDataProtection()
    .SetApplicationName("TvStore");
```

`ApplicationName` tách key của TV Store khỏi ứng dụng khác dùng chung nơi lưu.

Development vẫn dùng key store mặc định. Ngoài Development, ứng dụng bắt buộc có cấu hình:

```text
DataProtection__KeysPath=/durable/path/tv-store-keys
```

Nếu thiếu cấu hình, Production dừng ngay thay vì âm thầm chạy với key tạm. Đường dẫn phải nằm trên volume tồn tại qua restart/deploy và được chia sẻ nếu có nhiều instance.

## Bảo mật key ở Production

Persist key giải quyết tính liên tục của cookie, nhưng nơi lưu vẫn phải được bảo vệ:

- Chỉ identity chạy ứng dụng có quyền đọc/ghi thư mục.
- Không commit key XML vào Git.
- Volume phải bền vững và có backup phù hợp.
- Khi chọn cloud, cấu hình mã hóa key at rest bằng certificate hoặc key-management service của provider.

Chưa hard-code cơ chế Azure/AWS hoặc certificate trong bài này vì chưa chọn hạ tầng triển khai.

## Kiểm chứng

`tests/data-protection-config.ps1` publish và chạy artifact thật ở Production:

1. Không có `DataProtection__KeysPath`: ứng dụng từ chối khởi động.
2. Có đường dẫn: health check trả 200 và file `key-*.xml` được tạo.

Backend build, frontend lint và 48 test vẫn đạt. Bài này không thay đổi database và không cần migration.
