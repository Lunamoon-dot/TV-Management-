# Bài 44: giới hạn số lần gọi API đăng nhập

## Vấn đề thực tế

`PasswordSignInAsync(..., lockoutOnFailure: true)` đã khóa **một tài khoản** sau nhiều lần nhập sai. Tuy nhiên, một bot vẫn có thể thử nhiều email khác nhau và liên tục tạo tải lên endpoint đăng nhập.

Rate limiting bổ sung một lớp đứng trước controller:

```text
POST /api/auth/login
        ↓
ASP.NET RateLimiter theo IP
        ↓ còn lượt
CSRF → model binding → AuthController → Identity

        ↓ hết lượt
429 Too Many Requests (controller không chạy)
```

Hai cơ chế có trách nhiệm khác nhau:

- **Rate limit:** giới hạn lưu lượng từ một nguồn gọi API.
- **Identity lockout:** bảo vệ một tài khoản khi mật khẩu bị thử sai nhiều lần.

## Phần đã triển khai

Policy `login` dùng fixed window trong `Program.cs`:

- Mỗi địa chỉ IP có tối đa 10 request đăng nhập trong một phút.
- Không xếp request dư vào hàng đợi.
- Request thứ 11 nhận `429 Too Many Requests` dưới dạng `ProblemDetails`.
- Header `Retry-After` cho client biết thời gian nên chờ.
- Policy chỉ gắn lên `POST /api/auth/login`; catalog và các API khác không bị ảnh hưởng.

React nhận `429` và hiện thông báo chờ một phút. Đây chỉ là thông báo UX; backend mới là nơi thực sự chặn request.

## Vì sao dùng IP thay vì email từ body?

Limiter chạy trước controller và không cần parse body. Dùng email làm khóa còn giúp kẻ tấn công cố ý gửi nhiều request để khóa hoặc làm nghẽn riêng tài khoản của người khác. IP là điểm bắt đầu đơn giản cho phiên bản này.

Khi deploy sau reverse proxy/load balancer, phải cấu hình forwarded headers và danh sách proxy tin cậy để `RemoteIpAddress` là IP client thật. Nếu chạy nhiều instance, limiter in-memory của mỗi instance không chia sẻ bộ đếm; lúc đó cần rate limit ở gateway hoặc một bộ đếm phân tán.

## Kiểm chứng

Script `tests/login-rate-limit.ps1` dùng một session/CSRF token:

1. 10 lần gọi với tài khoản không tồn tại đều tới Identity và trả `401`.
2. Lần thứ 11 trả `429`, có `Retry-After` và payload `ProblemDetails`.
3. Test cookie/CSRF/Identity lockout cũ vẫn đạt sau khi thêm middleware.

Không có thay đổi schema hoặc migration database trong bài này.
