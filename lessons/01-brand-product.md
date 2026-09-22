# Bài 1: Quan hệ Brand–Product

## Phạm vi bài này

Đây là bài thiết kế trước migration. Thiết kế đã được triển khai trong bài `02-brand-migration.md`: Product.Brand hiện là navigation, BrandId là FK; request nhận BrandId. Phần dưới giữ ví dụ trước/sau để giải thích thay đổi.

## Dữ liệu trước và sau

Hiện mỗi Product lưu tên hãng trực tiếp:

| Id | Name | Brand |
|---|---|---|
| 1 | Samsung TV 55 inch | Samsung |
| 2 | Samsung TV 65 inch | Samsung |

Dữ liệu minh họa sau khi chuyển (không phải ID được cam kết trong database thực tế):

Brands:

| Id | Name |
|---|---|
| 1 | Samsung |

Products:

| Id | Name | BrandId |
|---|---|---|
| 1 | Samsung TV 55 inch | 1 |
| 2 | Samsung TV 65 inch | 1 |

Một Brand có thể chưa có hoặc có nhiều Product. Mỗi Product trong thiết kế này bắt buộc thuộc một Brand. Tên hãng lưu tập trung nên đổi tên hãng không cần cập nhật từng sản phẩm.

## Entity dự kiến

```csharp
namespace nothing.Models;

public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
```

```csharp
namespace nothing.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public decimal Price { get; set; }
    public int Stock { get; set; }
}
```

- Brand.Id: khóa chính xác định bản ghi hãng.
- Product.BrandId: giá trị khóa ngoại lưu trong bảng Products.
- Product.Brand: navigation property, tham chiếu đối tượng Brand trong bộ nhớ C#. Nó không phải cột chứa JSON hãng trong SQL Server.
- Không bắt buộc có collection Products trên Brand; quan hệ có thể chỉ có navigation một chiều như bài này. Có thể thêm chiều ngược khi có nhu cầu.
- `null!` tắt cảnh báo nullable tại chỗ khởi tạo, không tự tạo hay tải Brand. Brand chỉ có giá trị khi được gán hoặc EF đã tải/gắn entity liên quan.

## Khai báo cho EF Core

Trong thiết kế mới, AppDbContext có thêm `DbSet<Brand> Brands`. Cấu hình quan hệ dự kiến trong OnModelCreating:

```csharp
modelBuilder.Entity<Product>()
    .HasOne(product => product.Brand)
    .WithMany()
    .HasForeignKey(product => product.BrandId)
    .OnDelete(DeleteBehavior.Restrict);
```

- HasOne: mỗi Product liên kết một Brand.
- WithMany: một Brand liên kết nhiều Product; chưa khai báo navigation chiều ngược.
- HasForeignKey: chỉ rõ cột chứa ID tham chiếu.
- Restrict: không cho xóa hãng khi vẫn còn sản phẩm tham chiếu. Xóa một Product không có nghĩa xóa Brand của nó.

Cấu hình C# mô tả quan hệ cho EF; migration được áp dụng mới tạo bảng/cột/ràng buộc tương ứng trong SQL Server. Khi có foreign key constraint, database từ chối BrandId trỏ tới hãng không tồn tại. API vẫn nên kiểm tra trước để trả lỗi dễ hiểu cho client.

## Đọc dữ liệu liên quan

Sau khi triển khai schema và entity mới, ví dụ lấy TV kèm hãng:

```csharp
var product = await _context.Products
    .AsNoTracking()
    .Include(product => product.Brand)
    .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);
```

Nếu có Product, `product.Brand.Name` cho biết tên hãng đã tải. Khai báo navigation không tự bật lazy loading; project hiện chưa cấu hình lazy loading. Với API thực tế, có thể dùng Select sang response DTO để lấy đúng trường cần thiết thay vì trả entity trực tiếp; sẽ học khi cập nhật API.

Liên hệ MongoDB/Mongoose: BrandId gần với trường lưu ObjectId tham chiếu; Include có mục đích gần với populate, nhưng cơ chế truy vấn không giống hệt. Điểm chính của bài SQL là foreign key constraint được database thực thi sau khi migration áp dụng.

## Bước tiếp theo

1. Kiểm tra các giá trị Brand hiện có và thống nhất tên trùng/khác chữ hoa hoặc khoảng trắng.
2. Tạo Brands, thêm BrandId tạm nullable, đưa tên hãng hiện có sang Brands rồi gán BrandId cho từng Product.
3. Kiểm tra tất cả Product đã có BrandId hợp lệ, đặt cột bắt buộc và tạo FK; chỉ bỏ cột Brand cũ sau khi dữ liệu đã được chuyển.
4. Cập nhật request/response DTO, controller và file .http cùng nhau; build và kiểm tra dữ liệu cũ, hãng không tồn tại, truy vấn kèm hãng và quy tắc xóa.

Không thay cột Brand bằng BrandId mặc định 0 rồi chạy migration một cách máy móc: 0 chưa chắc là hãng tồn tại và tên hãng cũ có thể bị mất. Đây là phần cần đọc kỹ migration trước khi chạy.

Tài liệu tham khảo: [EF Core one-to-many relationships](https://learn.microsoft.com/en-us/ef/core/modeling/relationships/one-to-many).
