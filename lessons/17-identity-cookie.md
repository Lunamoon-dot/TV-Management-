# Bài 17: Cookie đăng nhập, /me, đăng xuất và CSRF

## Phạm vi

Backend có GET /api/auth/csrf, POST login, GET me, POST logout. Register/login/logout yêu cầu CSRF token. Chưa có form React đăng nhập, role seed, bảo vệ catalog, email confirmation hoặc rate limiting hoàn chỉnh. Catalog ghi dữ liệu vẫn là bài local; thêm auth routes không tự bảo vệ các action Product.

## Một lần đăng nhập và các request sau

POST login nhận email/password, SignInManager.PasswordSignInAsync kiểm tra qua Identity. Thành công ghi Set-Cookie TvStore.Auth vào response204. Không có JWT trong JSON. Browser lưu cookie và gửi lại ở request cùng origin/phạm vi phù hợp. Request GET me đi qua UseAuthentication, middleware kiểm tra cookie, tạo HttpContext.User; Authorize yêu cầu danh tính đăng nhập trước khi action chạy. Me lấy UserId từ User, không nhận ID tùy ý từ query.

Cookie chứa authentication ticket được bảo vệ bằng ASP.NET Data Protection, không phải password hoặc bản ghi session SQL bắt buộc. Không lưu cookie vào localStorage/Zustand. HttpOnly chặn JavaScript đọc cookie nhưng browser vẫn gửi cookie khi request phù hợp. Zustand ở bài React sau chỉ giữ thông tin user lấy từ me.

## Code cần đọc

Program: AddSignInManager nối dịch vụ đăng nhập vào Identity; AddAuthentication và AddIdentityCookies đăng ký các scheme Identity; ConfigureApplicationCookie đặt chính sách. UseAuthentication đứng trước UseAuthorization.

AuthController.Login gọi PasswordSignInAsync(email, password, isPersistent:false, lockoutOnFailure:true). Dùng email làm username theo thiết kế đăng ký. DTO login không áp lại mọi quy tắc tạo mật khẩu; kiểm tra required/max length rồi Identity kiểm tra mật khẩu thực tế. Sai tài khoản, sai mật khẩu hoặc bị khóa trả cùng thông báo401. Không tự bật MFA hoặc xác nhận email trong bài này.

Me có Authorize; anonymous nhận401 thay vì chuyển tới trang HTML (hành vi API trên .NET10). Role chưa gán nên roles=[]; đăng nhập không có nghĩa là admin.

Logout gọi SignOutAsync, trả204 và gửi cookie hết hạn để client xóa. Nó không xóa tài khoản trong SQL. Cookie bị sao chép trước đó không tự bị thu hồi ngay chỉ nhờ xóa cookie ở browser; quản lý thu hồi/security stamp và đăng xuất mọi thiết bị là phần tiếp theo về session.

## CSRF: vì sao ngoài cookie còn có token?

Browser có thể tự gửi cookie. Không nên dùng riêng việc cookie có mặt làm bằng chứng rằng request thay đổi trạng thái được ứng dụng của mình chủ động gửi. Antiforgery dùng cookie CSRF kết hợp request token và ràng buộc danh tính.

GET csrf gọi IAntiforgery.GetAndStoreTokens: đặt cookie TvStore.Csrf (HttpOnly) và trả { token } cho client. Khi POST, client gửi header X-CSRF-TOKEN với token vừa nhận; browser gửi cookie kèm theo. Website khác không được tùy ý đọc token response của origin mình. SameSite là lớp bổ sung, không dùng thay token. Không mở CORS cho mọi origin có credentials.

Sau login/logout, danh tính thay đổi: lấy token mới trước lần POST tiếp. Token anonymous không dùng để logout user đã đăng nhập. Register/login cũng kiểm tra CSRF; đăng ký không đổi danh tính vì không tự đăng nhập.

AddControllersWithViews thay AddControllers để đăng ký MVC filter ValidateAntiForgeryToken; không tạo Razor UI, action vẫn trả JSON. AddAntiforgery đơn thuần chưa đăng ký MVC filter này. Thiếu/sai CSRF bị trả400 trước action. Các action Product chưa thêm CSRF/Authorize, sẽ làm cùng bài quyền quản trị.

## Cookie hiện tại

TvStore.Auth: HttpOnly, SameSite=Lax, ticket30 phút, sliding expiration; isPersistent=false tạo session cookie, không hiểu là browser luôn chắc chắn xóa khi đóng (tính năng khôi phục session có thể giữ). Development dùng SecurePolicy SameAsRequest để bài localhost HTTP hoạt động; ngoài Development dùng Always, cần HTTPS. Production phải cấu hình/persist Data Protection keys và reverse proxy HTTPS đúng ở bài deploy.

TvStore.Csrf: HttpOnly, SameSite=Strict, SecurePolicy tương tự. Token request trả trong JSON, client giữ trong bộ nhớ. CSRF không thay xác thực, không cấp quyền admin, không chống XSS hoàn toàn.

Identity mặc định khóa tài khoản5 phút sau5 lần sai liên tiếp, lockoutOnFailure=true bật đếm cho luồng login này. Lockout không thay rate limiting theo nguồn gọi; cần hoàn thiện chống brute force/abuse trước public.

## Thử bằng PowerShell7, cookie jar tự giữ cookie

Restart API từ VS profile http sau khi build. Dùng tài khoản local đã đăng ký trong bài16. Mẫu dưới chỉ chứa mật khẩu học local, không dùng mật khẩu thật hoặc commit credential cá nhân:

```powershell
$base = 'http://localhost:5005'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$csrf = (Invoke-RestMethod "$base/api/auth/csrf" -WebSession $session).token
$body = @{ email='learner@example.test'; password='Learning-Only-123!' } | ConvertTo-Json
Invoke-WebRequest "$base/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $body
Invoke-RestMethod "$base/api/auth/me" -WebSession $session
$csrf = (Invoke-RestMethod "$base/api/auth/csrf" -WebSession $session).token
Invoke-WebRequest "$base/api/auth/logout" -WebSession $session -Method Post -Headers @{ 'X-CSRF-TOKEN'=$csrf }
Invoke-WebRequest "$base/api/auth/me" -WebSession $session -SkipHttpErrorCheck
```

Kỳ vọng204 → tài khoản JSON →204 →401. Nếu chưa đăng ký, POST register với cùng body và CSRF header trước login. WebSession giữ cookie như browser; PowerShell có thể giữ cả custom header, khi thử thiếu CSRF phải chủ động Remove header khỏi session.Headers.

nothing/auth.http cũng có mẫu nhưng cần copy cookie/token thủ công; không commit giá trị thực. Sau logout không gửi lại authCookie cũ từ biến .http: đó là replay cookie, không giống cookie jar đã xử lý lệnh xóa của server.

## Kiểm tra

tests/auth-cookie.ps1 dùng email GUID riêng: anonymous401, thiếuCSRF400 cho register/login/logout, password sai401, login204 + HttpOnly/SameSite, me đúng user/no role, token cũ bị chặn sau login, logout204, me401, lockout hoạt động. tests/auth-register.ps1 đã lấy CSRF trước POST và vẫn đạt. Product filter đạt. Account test được dọn riêng, API5006 đã dừng. Không migration.

Nguồn:
- https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0
- https://learn.microsoft.com/en-us/aspnet/core/breaking-changes/10/cookie-authentication-api-endpoints?view=aspnetcore-10.0
