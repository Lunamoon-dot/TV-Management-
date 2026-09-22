# Bài 5: Quan sát Dependency Injection qua ProductService

## Thay đổi trong bài

Chỉ GET danh sách TV được chuyển sang Services/ProductService.cs. Query lọc, đếm, phân trang và response giữ nguyên. Controller nhận query string, gọi service và trả HTTP 200. Service nhận DTO, dùng EF truy vấn và trả ProductPageResponse; service không trả IActionResult, không biết Ok() hay HttpContext.

Các action khác vẫn dùng AppDbContext trong controller để người học đối chiếu từng bước. Chưa thêm interface/repository hoặc chuyển hàng loạt module. Không cần migration vì schema không đổi.

## 1. Đăng ký trong Program.cs

```csharp
builder.Services.AddScoped<ProductService>();
```

Đăng ký này nói cho DI biết cách cung cấp ProductService khi có thành phần yêu cầu. Nó không tạo ngay một service dùng chung toàn ứng dụng. Scoped nghĩa là tái sử dụng một instance trong một scope; trong luồng HTTP thông thường, scope gắn với một request.

AddDbContext<AppDbContext> có sẵn cũng mặc định scoped. DI resolve dependency của service bằng đăng ký đó.

## 2. Constructor của service

```csharp
private readonly AppDbContext _context;

public ProductService(AppDbContext context)
{
    _context = context;
}
```

DI thấy ProductService cần AppDbContext nên cung cấp context đã cấu hình SQL Server. Không phải mình tự new context trong service. readonly chặn gán lại field sau constructor, không làm database hoặc context thành read-only.

## 3. Constructor và action của controller

```csharp
public ProductsController(AppDbContext context, ProductService productService)
{
    _context = context;
    _productService = productService;
}
```

Controller hiện vẫn cần context cho các action chưa chuyển. Cùng scope và cùng đăng ký DbContext, context truyền vào controller và service là cùng instance.

```csharp
var result = await _productService.GetProductsAsync(request, cancellationToken);
return Ok(result);
```

request là DTO do ASP.NET bind từ query và validate. _productService là dependency do DI truyền vào constructor. Hai loại đầu vào này có nguồn khác nhau. GetProductsAsync là method do mình đặt tên; nó không tự trở thành HTTP endpoint.

Luồng: HTTP request → tạo controller và dependency cần thiết → action GET → ProductService.GetProductsAsync → EF Core → SQL Server → DTO → controller trả Ok.

## 4. Thực hành breakpoint trong Visual Studio

1. Dừng phiên chạy cũ nếu có. Mở ProductService.cs, đặt breakpoint ở dòng `_context = context;` trong constructor và dòng `var query = _context.Products.AsQueryable();` trong GetProductsAsync.
2. Trong ProductsController.cs đặt breakpoint ở dòng `var result = await _productService.GetProductsAsync(...)` và `return Ok(result);` của GET danh sách. Có thể đặt thêm ở constructor controller nếu muốn so context.
3. Chọn Debug → Start Debugging (F5 hoặc Fn+F5), không chọn Start Without Debugging vì cần debugger bắt breakpoint.
4. Trong nothing.http gửi GET `/api/products?brandId=2&page=1&pageSize=1`.
5. Ở constructor service, xem `context.ContextId`: đây là context DI vừa cung cấp. Bấm Continue để đi đến action controller. Khi ứng dụng đang dừng tại breakpoint, client còn chờ response là bình thường.
6. Ở action, xem `request.BrandId`, `request.Page`, `_context.ContextId`; ContextId ở controller trùng với giá trị đã thấy trong service. Chọn Step Into để đi vào GetProductsAsync; hoặc Continue đến breakpoint đặt sẵn trong service.
7. Trong service, xem `request` và `_context.ContextId`. Đi đến CountAsync/ToListAsync để thấy thời điểm truy vấn chạy. Ở `return Ok(result)` xem result.Items và result.TotalCount.
8. Continue cho request hoàn tất. Gửi lại cùng URL: constructor service được gọi cho request mới và ContextId đổi so với request trước.

Để kiểm tra chính xác việc tái sử dụng service trong cùng scope, tại breakpoint trong controller có thể xem biểu thức:

```csharp
object.ReferenceEquals(
    _productService,
    HttpContext.RequestServices.GetRequiredService<ProductService>())
```

Kết quả là true: resolve lại trong scope hiện tại trả cùng service. Đây chỉ là biểu thức quan sát trong debugger, không cần chèn service locator vào code production.

Constructor được gọi không có nghĩa action đã chạy: dependency có thể được tạo trước khi framework trả lỗi validation. Dùng request hợp lệ cho bài quan sát luồng này.

## 5. Ý nghĩa thực tế

DI lo tạo, cung cấp và quản lý lifetime; service giúp tách phần truy vấn/xử lý khỏi HTTP. Việc tách này không tự làm SQL nhanh hơn. Khi có nghiệp vụ nhiều bước, ta sẽ tập trung các quy tắc đó trong service và kiểm thử chúng.

## Kiểm tra đã chạy

Hai script tests/product-filters.ps1 và tests/product-pagination.ps1 đạt cả trước và sau khi tách. GET chi tiết vẫn trả 200. Build thành công; không thay dữ liệu; phiên kiểm tra cổng 5006 đã dừng. Cảnh báo precision Price có từ trước không được thay trong bài này.
