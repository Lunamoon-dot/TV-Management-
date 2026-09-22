# Bài 16: Đăng ký tài khoản bằng UserManager

## Phạm vi

Thêm POST /api/auth/register trong Features/Auth cùng RegisterRequest/RegisterResponse. Đây là feature mới tổ chức theo tính năng; chưa di chuyển Controllers/DTOs cũ. Đã có user storage từ bài15 nên không cần migration. Chưa có form React, cookie hoặc tự đăng nhập.

## Thử

Stop/build/run lại API trong Visual Studio để dùng code mới. Mở nothing/auth.http rồi gửi request đầu; dùng email ví dụ local, không nhập mật khẩu đang dùng ở tài khoản thật vào file source. Gửi lại cùng email sẽ nhận400. Mẫu mật khẩu trong file chỉ để học, không phải tài khoản admin hay secret triển khai.

Request JSON có email/password. Backend response201 chỉ có id/email. PasswordHash/SecurityStamp không trả ra ngoài. Role và EmailConfirmed không có trong DTO, client gửi thêm cũng không được gán vào entity.

## Đọc action

```csharp
var email = request.Email.Trim();
var user = new ApplicationUser { UserName = email, Email = email };
var result = await _userManager.CreateAsync(user, request.Password);
```

new ApplicationUser chỉ tạo đối tượng trong bộ nhớ. UserName dùng cùng email để tận dụng unique NormalizedUserName của Identity cho đăng nhập bằng email. Identity chuẩn hóa UserName/Email để tra cứu; không phải frontend tự gửi NormalizedEmail. EmailIndex bản thân không unique; RequireUniqueEmail là kiểm tra dịch vụ, còn UserName unique trong DB là ràng buộc bổ sung cho thiết kế này.

Không Trim mật khẩu: khoảng trắng là một phần dữ liệu mật khẩu nếu người dùng nhập. UserManager nhận password để kiểm tra policy, tạo hash bằng password hasher, rồi dùng EF store lưu tài khoản. Không tự gán PasswordHash và không gọi thêm _context.SaveChangesAsync ở controller vì EF store mặc định đã lưu trong CreateAsync.

UserManager được inject qua constructor nhờ đăng ký AddIdentityCore/AddEntityFrameworkStores ở bài15. Không tự new UserManager. CreateAsync(user,password) không có tham số CancellationToken trong chữ ký đang dùng, nên action không thêm token không sử dụng.

## Hai tầng validation server

1. RegisterRequest: Required, EmailAddress, email tối đa256; mật khẩu12–128 ký tự. ApiController trả400 trước action nếu sai.
2. UserManager: policy password và kiểm tra tài khoản. Program.cs đặt RequiredLength12, RequireUniqueEmail=true; các yêu cầu mặc định chữ hoa/chữ thường/chữ số/ký tự không phải chữ-số vẫn bật.

Ví dụ abcdefghijklmnop đủ độ dài DTO nhưng thiếu các nhóm ký tự nên IdentityResult.Succeeded=false. Đây là kết quả nghiệp vụ dự kiến, không phải exception500.

Khi lỗi, controller chuyển result.Errors thành ModelState rồi ValidationProblem. Code lỗi bắt đầu Password được gắn vào field Password; các lỗi tài khoản còn lại gắn Email vì UserName=email. Form React ở bài sau có thể hiển thị dưới đúng ô tương tự form TV.

Email trùng trả400 errors.Email; hiện thông báo phục vụ học local cho biết không đăng ký được. Trước khi public cần thiết kế chống dò email, xác minh email, giới hạn tần suất/abuse và xử lý cạnh tranh đăng ký cùng lúc. Unique constraint tránh bản ghi trùng nhưng hai request đồng thời vẫn có thể cần ánh xạ lỗi DB thích hợp; chưa coi endpoint này hoàn thiện production.

## Hash không phải mã hóa để giải mã

DB lưu PasswordHash, không lưu password gốc. Sau này UserManager/SignInManager dùng password hasher để kiểm tra mật khẩu nhập có khớp hay không; không giải mã hash. Không query/trả hash qua API, không log request body có password. Không sửa hash thủ công bằng SQL.

Có thể quan sát mà không xuất hash ra màn hình:

```sql
SELECT Id, UserName, Email, EmailConfirmed,
       CASE WHEN PasswordHash IS NOT NULL THEN 1 ELSE 0 END AS HasPassword
FROM dbo.AspNetUsers;
```

User vừa đăng ký EmailConfirmed=false và chưa được gán role. Đăng ký không tự cấp Admin/Customer ở bài này. AspNetUserRoles vẫn không có dòng tương ứng.

## Đăng ký chưa phải đăng nhập

CreateAsync thành công là lưu user. Response không có Set-Cookie, browser chưa có danh tính đăng nhập. Cookie/SignInManager, chống CSRF và [Authorize] sẽ được nối ở các bài tiếp. Không gắn Authorize vào Products chỉ vì đã có UserManager.

## Breakpoint

Đầu Register: xem request (không chia sẻ screenshot chứa password thật). Sau new user: đối tượng chưa được lưu. Sau CreateAsync: xem result.Succeeded/result.Errors; trường PasswordHash đã được tạo khi thành công. Chỉ quan sát local. Gửi mật khẩu ngắn thấy action không chạy; gửi mật khẩu đủ dài nhưng yếu thấy action chạy và result thất bại.

## Kiểm thử

Build đạt. tests/auth-register.ps1 chạy với API local5006/SQL NothingDb: DTO400, policy400, quá độ dài400, đăng ký201, trùng email khác casing400, response chỉ id/email và không có cookie. SQL xác nhận tài khoản có hash/normalized fields, chưa xác minh và không có role dù client gửi role=Admin. Account test dùng email GUID và được dọn riêng; không xóa account người học. Script cần sqlcmd, PowerShell7 và API dùng đúng DB được truyền; không chạy vào DB khác.

Test lọc sản phẩm vẫn đạt; phiên5006 đã dừng. Không migration, không sửa dữ liệu catalog.

Nguồn: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0
