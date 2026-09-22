# Bài 6: Exception, middleware và xử lý lỗi chung

## Tình huống trong project

GET /api/products đi qua ProductsController.Get → ProductService.GetProductsAsync → EF Core → SQL Server. Nếu SQL không kết nối được, dòng `await query.CountAsync(cancellationToken)` ném exception. Các dòng phía sau trong service không chạy; controller đang await service cũng không đi tiếp tới `return Ok(result)`.

Exception truyền ngược qua các lời gọi đang await cho đến nơi bắt nó. Điều này không đồng nghĩa cả tiến trình API tắt. Một request thất bại có thể được chuyển thành response 500 và API tiếp tục nhận request khác.

## 1. Return và throw khác nhau

```csharp
if (product is null)
{
    return NotFound();
}
```

Đây là controller chủ động trả 404. Không có exception và GlobalExceptionHandler không chạy. Tương tự, DTO có Page=0 bị validation trả 400 trước khi vào action.

Ngược lại, SQL mất kết nối là exception từ thư viện. `throw` ngắt luồng thực thi bình thường. `await` một tác vụ thất bại làm exception xuất hiện tại điểm await của hàm gọi.

Không dùng catch rồi trả danh sách rỗng: client sẽ hiểu nhầm hệ thống hoạt động bình thường nhưng không có TV. Không biến mọi exception thành 400: đó là đổ lỗi cho input dù server có vấn đề.

## 2. Middleware đứng ở đâu?

Middleware là thành phần của đường đi request/response. Hình dung middleware xử lý exception bao quanh phần phía sau:

```csharp
// Minh họa ý tưởng, không phải code cần thêm vào project.
try
{
    await next(httpContext);
}
catch (Exception exception)
{
    // Ghi log và tạo response lỗi.
}
```

`next` gọi phần tiếp theo của pipeline; ở sâu bên trong sẽ tới controller/service. Vì vậy middleware đứng trước controller vẫn bắt được exception truyền ngược từ service. Nó không phải một action được client gọi bằng URL.

Trong Program.cs, `app.UseExceptionHandler()` đặt sớm, trước các middleware/endpoint cần bảo vệ. Handler chỉ xử lý exception trong pipeline phía sau nó; không sửa lỗi build hay lỗi khởi động chiếm cổng. Nếu response đã bắt đầu gửi thì không thể luôn thay thế bằng JSON lỗi.

## 3. Ba dòng đăng ký

```csharp
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
// Sau builder.Build():
app.UseExceptionHandler();
```

- AddExceptionHandler đăng ký lớp xử lý exception với DI.
- AddProblemDetails đăng ký dịch vụ tạo response lỗi chuẩn, cũng cung cấp fallback cho middleware khi handler không xử lý.
- UseExceptionHandler đưa middleware vào pipeline để bắt exception và gọi handler đã đăng ký.

Chỉ đăng ký lớp mà không thêm middleware thì handler chưa có thành phần gọi nó. ProblemDetails là cấu trúc mô tả lỗi, không phải bộ validation hay cơ chế sửa lỗi.

## 4. Đọc GlobalExceptionHandler

Mở `nothing/ExceptionHandlers/GlobalExceptionHandler.cs`.

`IExceptionHandler` là interface có sẵn của ASP.NET Core. Framework gọi TryHandleAsync với HttpContext của request đang lỗi, Exception đã bắt và CancellationToken. Tên tham số không phải từ khóa đặc biệt; interface quy định chữ ký phương thức.

`ValueTask<bool>` là kiểu kết quả bất đồng bộ mà interface yêu cầu. Ở bài này đọc như một thao tác await được, trả về bool. Không cần đổi mọi Task trong project thành ValueTask.

`ILogger<GlobalExceptionHandler>` do DI cung cấp. LogError nhận exception để ghi chi tiết phục vụ debug, kèm method, path và TraceId. Các placeholder `{Method}`… giữ thông tin có cấu trúc. Không đưa body, cookie hay thông tin đăng nhập vào log này. Các thư viện như EF có thể ghi thêm log riêng.

`HttpContext.TraceIdentifier` nhận diện request. Cùng giá trị này xuất hiện ở JSON gửi client và log server, giúp tìm lỗi tương ứng.

Handler tạo ProblemDetails chứa status/title/detail/traceId. Nó không gửi exception.Message hay stack trace. `Response.StatusCode = 500` đặt HTTP status thật; `problem.Status = 500` chỉ đặt trường trong body. Cần cả hai để nhất quán.

WriteAsJsonAsync ghi JSON với Content-Type application/problem+json. Handler hiện luôn dùng dạng JSON này, kể cả request có Accept text/html, vì đây là API.

`return true` báo middleware: đã xử lý exception và viết response. Nó KHÔNG có nghĩa thao tác nghiệp vụ thành công, không chạy lại query, không quay lại dòng bị lỗi. `false` cho phép middleware thử handler tiếp theo/fallback.

Handler được đăng ký dạng singleton: không giữ dữ liệu riêng của request trong field và không inject DbContext scoped vào đây. traceId/problem được tạo bằng biến local mỗi lần gọi. Trên .NET 10, diagnostics mặc định của middleware có thể bị tắt cho exception đã xử lý; handler này tự ghi log rõ ràng.

## 5. Đối chiếu Express

Trong Express, error middleware có chữ ký `(err, req, res, next)` và thường đặt sau routes. Route chuyển lỗi tới nó bằng next(err); cách tự chuyển promise rejection còn phụ thuộc phiên bản Express. Trong ASP.NET, exception từ tác vụ được await truyền ngược tới middleware bao ngoài; UseExceptionHandler đặt trước phần cần bắt lỗi.

Điểm giống nhau: gom việc tạo response lỗi và ghi log về một chỗ. Không cần bao mọi action bằng try/catch giống hệt nhau. Chỉ catch cục bộ nếu có cách xử lý cụ thể, chẳng hạn chuyển một xung đột đã nhận diện thành lỗi nghiệp vụ; khi cần ném lại dùng `throw;` để giữ stack trace gốc.

## 6. Tự quan sát bằng breakpoint

Luồng bình thường: đặt breakpoint ở controller trước await service, service tại CountAsync, handler đầu TryHandleAsync. Gửi GET hợp lệ: controller → service → Ok; handler không được gọi.

Luồng lỗi: dùng một terminal PowerShell riêng, từ thư mục solution, chạy API với cấu hình SQL sai chỉ trong phiên đó:

```powershell
$env:ConnectionStrings__DefaultConnection = 'Server=tcp:127.0.0.1,1;Database=NothingDb;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=1;ConnectRetryCount=0'
dotnet run --project nothing/nothing.csproj --no-launch-profile --urls http://localhost:5006
```

Gửi GET http://localhost:5006/api/products. Terminal cho thấy exception đi qua service/controller và log handler; client nhận 500 có traceId. Không tắt SQL Server hoặc sửa appsettings.json. Để đặt breakpoint trong tiến trình này, dùng Visual Studio Debug → Attach to Process và chọn đúng tiến trình API vừa chạy. Nếu debugger dừng ngay khi exception được ném, Continue để quan sát handler.

Ở terminal khác, từ thư mục solution, chạy `./tests/error-handling.ps1`. Script chỉ đọc, yêu cầu API 5006 đang dùng SQL không truy cập được. Nó kiểm tra response 500 an toàn, traceId khác nhau, validation 400 và route 404.

Dừng API bằng Ctrl+C rồi đóng terminal riêng để bỏ biến môi trường thử nghiệm. Chạy lại API bình thường với launch profile của bạn. Không cần migration hay package mới.

## Phạm vi bài

Đây là nền tảng xử lý exception chưa dự kiến, chưa phải retry, transaction, cơ chế rollback hay hệ thống giám sát production. Lỗi nghiệp vụ và validation tiếp tục có status phù hợp. Khi học đặt hàng, ta sẽ phân biệt tiếp hết hàng, xung đột cập nhật và lỗi hạ tầng.

Tài liệu: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling?view=aspnetcore-10.0
