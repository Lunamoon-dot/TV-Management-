# Bài 46: Correlation ID để lần dấu một request

## Vấn đề thực tế

Một người dùng chỉ thấy “không tải được danh sách TV”, trong khi server có log của hàng nghìn request. Cần một mã chung để xác định đúng request lỗi.

```text
React gửi request
       ↓
CorrelationIdMiddleware chọn/tạo ID
       ↓
Controller → Service → EF Core
       ↓
Response header: X-Correlation-ID
       ↓ nếu lỗi 500
ProblemDetails.traceId và log dùng cùng ID
```

Người dùng hoặc frontend có thể cung cấp ID trong `X-Correlation-ID` để nối nhiều log của cùng một thao tác. Nếu không có, server tạo GUID mới.

## Middleware làm gì?

`CorrelationIdMiddleware` chạy ngoài exception handler để bao trọn pipeline:

1. Đọc `X-Correlation-ID` từ request.
2. Chỉ chấp nhận 1–64 ký tự ASCII gồm chữ, số, `-`, `_`, `.`.
3. Tạo GUID mới nếu header thiếu hoặc không hợp lệ.
4. Gán ID vào `HttpContext.TraceIdentifier`.
5. Mở logging scope có property `CorrelationId`.
6. Trả cùng ID trong response header.

Việc giới hạn định dạng ngăn client đưa chuỗi quá dài hoặc ký tự điều khiển vào log. Correlation ID chỉ phục vụ truy vết, không dùng để xác thực và không được coi là dữ liệu đáng tin.

## Khi có exception

`GlobalExceptionHandler` vốn đã đưa `HttpContext.TraceIdentifier` vào:

- log server;
- `ProblemDetails.traceId`.

Sau bài này, trace ID đó cũng có trong `X-Correlation-ID`. Ví dụ:

```text
X-Correlation-ID: 3a0d5bb29a244b2a9f913ac665dcefa2

{
  "status": 500,
  "title": "An unexpected error occurred.",
  "traceId": "3a0d5bb29a244b2a9f913ac665dcefa2"
}
```

Frontend có thể hiển thị mã này trong màn hình hỗ trợ sau này mà không lộ stack trace.

## Kiểm chứng

`tests/correlation-id.ps1` xác nhận:

- Server tự sinh ID và hai request có ID khác nhau.
- ID hợp lệ do client gửi được giữ lại.
- ID quá dài bị thay thế.

`tests/error-handling.ps1` dùng SQL endpoint không truy cập được để tạo lỗi thật và xác nhận header trùng với `ProblemDetails.traceId`. Backend build không warning/error. Không có thay đổi database hoặc migration.
