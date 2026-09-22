# Bài 4: Phân trang và tổng số kết quả

## Hợp đồng API mới

GET /api/products hiện trả object ProductPageResponse thay vì mảng trực tiếp. GET chi tiết, POST, PUT và DELETE giữ hợp đồng trước đó. Không cần migration.

```http
GET /api/products?brandId=2&page=1&pageSize=1
```

Kết quả mẫu trên dữ liệu hiện tại:

```json
{
  "items": [
    { "id": 1, "name": "Samsung 4K 55 inch", "brandId": 2, "brand": "Samsung", "price": 11990000, "stock": 12 }
  ],
  "totalCount": 2,
  "page": 1,
  "pageSize": 1
}
```

totalCount là số TV khớp bộ lọc trên tất cả trang, không phải số phần tử trong items. pageSize là giới hạn mỗi trang, trang cuối có thể ít hơn. React sẽ đọc response.data.items và tính số trang bằng Math.ceil(totalCount / pageSize).

## 1. Giá trị mặc định và validation

ProductQueryRequest thêm:

```csharp
[Range(1, 1000000)]
public int Page { get; set; } = 1;

[Range(1, 100)]
public int PageSize { get; set; } = 20;
```

Không gửi tham số thì dùng mặc định. Gửi 0, số âm, chữ hoặc vượt giới hạn thì trả 400. Giới hạn Page là lựa chọn của API để chặn số bất thường và giữ phép nhân offset trong phạm vi int khi PageSize tối đa 100; không phải quy tắc bắt buộc của .NET.

## 2. Đếm sau lọc, trước Skip/Take

Sau các Where của hãng/từ khóa:

```csharp
var totalCount = await query.CountAsync(cancellationToken);
```

EF thực thi truy vấn COUNT ở SQL Server. Nó không tải tất cả TV về rồi đếm. query vẫn là IQueryable<Product>, có thể dùng tiếp để lấy trang.

Nếu đếm sau Skip/Take, chỉ đếm số dòng của trang đó và frontend sẽ không biết tổng số kết quả.

## 3. Lấy một trang

```csharp
var products = await query
    .OrderBy(product => product.Id)
    .Skip((request.Page - 1) * request.PageSize)
    .Take(request.PageSize)
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
```

Trang 1, size 2: Skip(0), Take(2). Trang 2: Skip(2), Take(2). Trang 3: Skip(4), Take(2). OrderBy theo khóa duy nhất Id giữ thứ tự xác định cho dữ liệu không đổi; không phân trang trên một thứ tự không xác định.

Skip/Take nằm trước ToListAsync nên SQL Server thực hiện việc bỏ/lấy dòng (OFFSET/FETCH). Đây là offset pagination, phù hợp bước đầu và UI nhảy trang. Trang rất sâu vẫn có thể tốn chi phí; keyset/cursor pagination là bài nâng cao khi cần.

## 4. Gói response

```csharp
return Ok(new ProductPageResponse
{
    Items = products,
    TotalCount = totalCount,
    Page = request.Page,
    PageSize = request.PageSize
});
```

Request một trang hợp lệ nhưng vượt dữ liệu trả 200 với items rỗng và totalCount vẫn đúng. Không có TV khớp bộ lọc thì totalCount = 0.

Có hai SQL query, được await lần lượt trên cùng DbContext. Không dùng Task.WhenAll cho hai thao tác này. Chưa tạo snapshot transaction: nếu có người thêm/xóa TV giữa hai query thì tổng và items có thể phản ánh hai thời điểm gần nhau. Khi cần tính nhất quán chặt hơn, sẽ thiết kế isolation/transaction phù hợp; không khẳng định phân trang hiện tại chống mọi thay đổi đồng thời.

## Kiểm tra và cách chạy

- Build thành công; test đã thất bại trước khi triển khai vì thiếu pagination và đạt sau khi thêm.
- tests/product-pagination.ps1 kiểm tra mặc định, trang 1/2, trang vượt dữ liệu, tổng sau lọc, không khớp và validation.
- tests/product-filters.ps1 đã cập nhật đọc items, chạy lại để kiểm tra bộ lọc không bị hỏng.
- Cả hai dùng dữ liệu mẫu local, không ghi/xóa dữ liệu; pagination test cần 3–99 TV, filter test cần ít nhất hai hãng có TV và tối đa 100 TV.
- Phiên kiểm tra 5006 đã dừng. Chạy lại project bằng Visual Studio rồi dùng các request trong nothing.http. Hoặc chạy các script với -BaseUrl http://localhost:5005.

Bài tiếp theo chọn theo câu hỏi người học: giải thích CountAsync/Skip/Take, hoặc bắt đầu đưa danh sách có bộ lọc và phân trang lên React. Không triển khai thêm module trong bài này.
