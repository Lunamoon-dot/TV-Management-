# Bài 3: Query string, lọc hãng và tìm tên TV

## Phạm vi và cách thử

Đây là bài lọc/tìm kiếm trước khi phân trang. Hiện bước sau đã triển khai ở lessons/04-product-pagination.md: response danh sách có items/totalCount/page/pageSize. Các ví dụ dưới đây mô tả logic lọc; khi thử trên code hiện tại, đọc danh sách trong items. Không cần migration vì chỉ thay cách nhận request và truy vấn.

Chạy lại project trong Visual Studio để nạp code mới. Các request đã có trong nothing.http:

```http
GET http://localhost:5005/api/products?brandId=2
GET http://localhost:5005/api/products?search=55
GET http://localhost:5005/api/products?brandId=2&search=Samsung
GET http://localhost:5005/api/products?brandId=0
```

Trên dữ liệu lúc kiểm tra: hãng 2 là Samsung, hai TV ID 1/2 thuộc hãng này; LG là hãng 1. Dùng GET /api/brands để lấy ID thực tế, không coi các số đó là hằng số mọi môi trường.

## 1. Nhận query string vào DTO

`DTOs/ProductQueryRequest.cs`:

```csharp
public class ProductQueryRequest
{
    [Range(1, int.MaxValue)]
    public int? BrandId { get; set; }

    [StringLength(200)]
    public string? Search { get; set; }
}
```

`int?` là nullable int: có thể chứa một số hoặc null. Nếu client không gửi brandId, giá trị là null và không lọc hãng. Nếu dùng int bình thường, mặc định 0 sẽ không phân biệt rõ việc không gửi với gửi số 0. Range không bắt buộc trường nullable phải có giá trị; nó kiểm tra khi có số.

`string?` cho phép Search là null; từ khóa tối đa 200 ký tự. BrandId không phải số, số ngoài phạm vi hoặc Search quá dài được [ApiController] trả 400 trước action. Search rỗng/chỉ khoảng trắng được xem như không lọc tên.

Action khai báo:

```csharp
public async Task<ActionResult<List<ProductResponse>>> Get(
    [FromQuery] ProductQueryRequest request,
    CancellationToken cancellationToken)
```

ASP.NET đọc phần sau dấu ? và gán các trường vào DTO, tương tự req.query trong Express. FromQuery chỉ rõ nguồn, tránh suy ra complex DTO là JSON body như action POST. GET không cần body ở bài này.

## 2. Xây truy vấn có điều kiện

```csharp
var query = _context.Products.AsQueryable();

if (request.BrandId.HasValue)
{
    query = query.Where(product => product.BrandId == request.BrandId.Value);
}

var search = request.Search?.Trim();
if (!string.IsNullOrEmpty(search))
{
    query = query.Where(product => product.Name.Contains(search));
}
```

- AsQueryable cho biến query kiểu IQueryable<Product>, dùng để ghép các điều kiện LINQ. Nó chưa lấy danh sách từ SQL Server.
- HasValue kiểm tra nullable int có giá trị. Value lấy số bên trong; chỉ đọc sau khi đã kiểm tra.
- ?.Trim(): nếu Search khác null thì Trim, nếu null thì cho kết quả null, tránh gọi phương thức trên null.
- Where trả một truy vấn mới. Phải gán lại query = query.Where(...); gọi Where rồi bỏ kết quả không thay đổi query ban đầu.
- Hai Where nối tiếp có nghĩa AND. BrandId = 1 và search = Samsung sẽ chỉ lấy TV vừa thuộc hãng 1 vừa có tên chứa Samsung; với dữ liệu mẫu là danh sách rỗng.
- Contains tìm chuỗi con, không phải tìm kiếm full-text. Hoa/thường và dấu phụ thuộc collation SQL Server. Không thêm ToLower chỉ để giả định mọi database giống nhau.

## 3. Thực thi tại SQL Server

Sau khi ghép điều kiện, code có sẵn tiếp tục:

```csharp
var products = await query
    .OrderBy(product => product.Id)
    .Select(product => new ProductResponse
    {
        Id = product.Id,
        Name = product.Name,
        BrandId = product.BrandId,
        Brand = product.Brand.Name,
        Price = product.Price,
        Stock = product.Stock
    })
    .ToListAsync(cancellationToken);

return Ok(products);
```

ToListAsync mới thực thi SQL; OrderBy theo Id giữ thứ tự ổn định. Select lấy đúng cột cần cho response và EF tự JOIN hãng. Query là biểu thức để EF dịch thành SQL có tham số; không nối input người dùng vào chuỗi SQL.

Không dùng ToListAsync trước Where: như vậy đã tải toàn bộ dữ liệu về bộ nhớ, rồi mới lọc bằng C#. Tìm chuỗi con vẫn có thể tốn công quét khi catalog lớn; index/tìm kiếm nâng cao là bài sau.

## 4. Quy tắc response

| Request | Kết quả |
|---|---|
| Không có tham số | Tất cả TV theo Id như trước |
| Chỉ brandId | Lọc hãng |
| Chỉ search | Lọc tên |
| Có cả hai | Kết hợp AND |
| brandId hợp lệ nhưng không có kết quả | 200 và [] |
| brandId=0, -1 hoặc abc | 400 có lỗi BrandId |
| Search dài quá 200 ký tự | 400 có lỗi Search |

Khác POST: GET đang lọc tập kết quả, nên hãng chưa có không cần trả lỗi không tồn tại. POST tạo sản phẩm phải xác nhận hãng tồn tại trước khi lưu.

## Kiểm chứng

Test đọc dữ liệu thật trong tests/product-filters.ps1 đã chạy trước khi sửa (thất bại vì API bỏ qua query) và chạy lại sau sửa (đạt). Có kiểm tra hãng, từ khóa, Trim, AND, không khớp, tham số rỗng, validation và dữ liệu không đổi. Script cần PowerShell 7 và database mẫu có TV thuộc ít nhất hai hãng, API đang chạy. Có thể chạy từ thư mục solution:

```powershell
./tests/product-filters.ps1 -BaseUrl http://localhost:5005
```

Mặc định script dùng cổng 5006 cho phiên kiểm tra riêng. Build đạt; phiên kiểm tra đã dừng. Bước sau: Page/PageSize, Skip/Take, CountAsync và response có tổng số kết quả.
