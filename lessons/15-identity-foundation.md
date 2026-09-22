# Bài 15: Nền tảng ASP.NET Core Identity và SQL Server

## Đã làm trong bài này

Thêm package Microsoft.AspNetCore.Identity.EntityFrameworkCore 10.0.11 cùng phiên bản EF đang dùng. Thêm Models/ApplicationUser.cs, đổi AppDbContext sang IdentityDbContext<ApplicationUser>, đăng ký AddIdentityCore + AddRoles + AddEntityFrameworkStores. Migration 20260917115852_AddIdentityAccounts đã áp dụng vào NothingDb, chỉ thêm 7 bảng Identity và index/FK tương ứng.

Chưa có endpoint đăng ký/đăng nhập, cookie scheme, SignInManager, role seed hoặc Authorize mới. API catalog tiếp tục hoạt động như trước. Có bảng và dịch vụ tài khoản chưa có nghĩa hệ thống auth đã hoàn thiện.

## Từ Express sang Identity

Nếu tự làm tài khoản ở Express, thường phải thiết kế User, hash/verify mật khẩu, kiểm tra trùng tài khoản, role và lưu DB. ASP.NET Core Identity cung cấp những thành phần cho các công việc này. Identity không phải giao diện React, không phải SQL Server và không đồng nghĩa JWT/cookie.

Ba trách nhiệm khác nhau:
- Identity: quản lý tài khoản, mật khẩu, role, các trạng thái bảo mật.
- Cookie authentication: nhận diện người dùng qua cookie ở các request tiếp theo, học ở bước sau.
- Authorization: quyết định người đã được nhận diện có quyền thực hiện thao tác hay không.

## 1. ApplicationUser

```csharp
public class ApplicationUser : IdentityUser
{
}
```

Dấu : là kế thừa. Lớp rỗng nhưng nhận sẵn thuộc tính của IdentityUser như Id, UserName, Email, PasswordHash, EmailConfirmed, SecurityStamp, LockoutEnd, AccessFailedCount. Không cần tự khai báo lại.

Id mặc định là string (thường được tạo dạng GUID), không bắt buộc giống Product.Id là int. Customer/Employee sẽ có FK UserId đúng kiểu string khi triển khai liên kết theo DATA_MODEL.md. Chưa thêm địa chỉ, ngày sinh hoặc profile nghiệp vụ vào bảng tài khoản trong bài này.

PasswordHash không phải mật khẩu gốc và không dùng để giải mã lấy lại mật khẩu. Khi thêm đăng ký, dùng UserManager.CreateAsync(user, password); khi kiểm tra dùng API Identity, không tự so password với hash, không tự gán PasswordHash. Không trả entity ApplicationUser nguyên vẹn cho frontend.

## 2. IdentityDbContext vẫn là DbContext

Trước:

```csharp
public class AppDbContext : DbContext
```

Sau:

```csharp
public class AppDbContext : IdentityDbContext<ApplicationUser>
```

IdentityDbContext là DbContext có thêm cấu hình entity Identity. Products và Brands vẫn trong cùng AppDbContext/database; không cần database mới chỉ để thêm tài khoản.

OnModelCreating đã gọi base.OnModelCreating(modelBuilder). Dòng này nay áp dụng cấu hình Identity (khóa, quan hệ, bảng/index); sau đó đến cấu hình Product/Brand của mình. Không bỏ lời gọi base này khi tùy chỉnh model Identity.

## 3. Đăng ký dịch vụ

```csharp
builder.Services.AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();
```

AddIdentityCore đăng ký các dịch vụ lõi cho kiểu user, như UserManager và xử lý mật khẩu. AddRoles đăng ký quản lý role. AddEntityFrameworkStores nối dịch vụ đó với EF dùng AppDbContext lưu/đọc SQL. Các dòng này không tự tạo bảng; migration mới cập nhật schema. AddRoles không tự thêm Admin/Customer vào bảng.

Khi viết endpoint đăng ký sau này, controller nhận UserManager<ApplicationUser> bằng DI, không tự new. Luồng dự kiến: DTO → UserManager → EF store → AppDbContext → SQL. Chưa thêm endpoint minh họa để giữ bài nhỏ.

## 4. Các bảng đã có

| Bảng | Vai trò |
|---|---|
| AspNetUsers | Tài khoản và các trạng thái bảo mật |
| AspNetRoles | Danh sách vai trò |
| AspNetUserRoles | Bảng nối user và role, quan hệ nhiều-nhiều |
| AspNetUserClaims | Các claim lưu cho user |
| AspNetRoleClaims | Các claim lưu cho role |
| AspNetUserLogins | Liên kết tài khoản đăng nhập từ nhà cung cấp ngoài |
| AspNetUserTokens | Dữ liệu token do user store quản lý khi tính năng tương ứng dùng tới |

Không cần học thuộc tất cả. Trước mắt tập trung Users/Roles/UserRoles. Có bảng token không có nghĩa ứng dụng đang dùng JWT, không phải mọi cookie/reset token đều nằm trong bảng này. Claims có thể hiểu tạm là cặp loại/giá trị mô tả danh tính hoặc quyền; sẽ giải thích lúc dùng.

Migration hiện có unique index NormalizedUserName và NormalizedName của role. EmailIndex không unique. Bài đăng ký bằng email sẽ phải chốt cấu hình/chiến lược email, không suy ra rằng Identity tự đảm bảo email unique ở DB.

SQL IDENTITY (tự tăng số) khác thư viện ASP.NET Identity (quản lý tài khoản), dù cùng chữ Identity.

## Tự quan sát trong SSMS

Mở NothingDb → Tables → Refresh. Xem AspNetUsers → Columns và so với IdentityUser. Xem AspNetUserRoles: UserId/RoleId là hai FK nối hai bảng. Query chỉ đọc:

```sql
SELECT COUNT(*) AS UserCount FROM dbo.AspNetUsers;
SELECT COUNT(*) AS RoleCount FROM dbo.AspNetRoles;
```

Sau bài này cả hai bằng 0. Không tự INSERT mật khẩu hay seed admin bằng SQL. Đọc migration Up để thấy CreateTable, các FK và index; không chạy Down trên database có tài khoản thật vì sẽ xóa các bảng này.

## Kiểm chứng

Migration đã được review chỉ tạo bảng Identity, không đổi Products/Brands. Trước/sau đối chiếu dữ liệu giữ 4 TV (ID1,2,3,8) và 2 hãng. Bảng user/role rỗng. Build thành công; model khớp snapshot; API chạy phiên kiểm tra riêng5006, test filter/pagination đều đạt, phiên đã dừng. Runtime còn cảnh báo precision Price đã ghi từ các bài trước, không phải lỗi mới của Identity.

Lần tạo migration dùng configuration IdentityLesson để build riêng, tránh khóa file của phiên Visual Studio đang chạy. Khi tiếp tục học trong Visual Studio hãy stop/build/run lại để nạp code mới; không cần tạo lại migration.

Bước sau: đăng ký tài khoản qua UserManager để quan sát cách password hash được lưu, rồi thêm đăng nhập cookie/CSRF/phân quyền theo từng bài.

Nguồn: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/customize-identity-model?view=aspnetcore-10.0
