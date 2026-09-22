# Bài 2: Đưa quan hệ Brand–Product vào project

## Kết quả

Đã áp dụng migration `20260912184708_AddProductBrands` vào NothingDb. Ba sản phẩm cũ giữ nguyên ID, tên, hãng, giá và tồn kho. Hãng hiện có: LG Id 1, Samsung Id 2. Đây là ID thực tế trên local, không phải hằng số cho mọi môi trường.

Đọc từng phần dưới đây; dừng để hỏi trước khi chuyển sang bài khác.

## 1. Entity và cấu hình EF

`Models/Brand.cs` có Id và Name. `Models/Product.cs` đổi chuỗi Brand thành BrandId (FK) và Brand (navigation). Navigation không phải cột chứa object trong SQL.

`Data/AppDbContext.cs` đăng ký DbSet Brands và cấu hình:

```csharp
modelBuilder.Entity<Product>()
    .HasOne(product => product.Brand)
    .WithMany()
    .HasForeignKey(product => product.BrandId)
    .OnDelete(DeleteBehavior.Restrict);
```

Đọc thành câu: mỗi Product có một Brand; Brand có nhiều Product; nối bằng BrandId; không xóa hãng đang có sản phẩm. WithMany() không có tham số vì chưa khai báo collection navigation ngược trên Brand.

Brand.Id là primary key theo quy ước. Brand.Name bắt buộc, dài tối đa 100, có unique index; tính trùng phụ thuộc collation database. Product.BrandId được phép trùng vì nhiều TV cùng hãng.

## 2. Tạo và đọc migration

Đã chạy từ thư mục solution:

```powershell
dotnet ef migrations add AddProductBrands --project nothing/nothing.csproj
```

EF so model hiện tại với model snapshot trước đó, không tự so toàn bộ schema database đang chạy. Migration tự sinh định xóa cột Brand và thêm BrandId mặc định 0. Mình đã sửa lại để bảo toàn dữ liệu:

1. Chặn hãng trống hoặc vượt 100 ký tự, tránh âm thầm cắt dữ liệu.
2. Tạo Brands và thêm BrandId tạm nullable.
3. INSERT DISTINCT các tên hãng từ Products vào Brands.
4. UPDATE Products.BrandId qua JOIN tên hãng cũ với Brands.Name.
5. Kiểm tra không còn BrandId null, đổi thành cột bắt buộc.
6. Tạo index, unique và FK; chỉ bỏ cột Brand cũ sau cùng.

Migration không tự Trim/đổi cách viết tên hãng. DISTINCT/JOIN dùng collation database nên các tên được coi là bằng nhau theo collation sẽ được gộp. Dữ liệu hiện tại đã kiểm tra chỉ có LG/Samsung.

SQL backfill dùng EXEC(N'...') để câu lệnh tham chiếu cột mới được biên dịch sau khi cột tồn tại; vì vậy script SQL sinh ra cũng chạy được. Các thao tác nằm trong transaction của migration.

Down chép Brands.Name về Products.Brand trước khi bỏ quan hệ. Nó khôi phục tên hãng hiện tại của sản phẩm; không phục hồi lịch sử tên hoặc hãng không có sản phẩm. Down không thay thế backup.

## 3. Áp dụng migration

Đã thử Up → Down → Up trên database tạm, rồi áp dụng vào local bằng:

```powershell
dotnet ef database update --project nothing/nothing.csproj
```

Các lệnh trong bài đã chạy; không cần tạo thêm migration trùng tên. Xem file hiện có trong Migrations để học.

## 4. API sau thay đổi

- GET /api/brands trả hãng đã có để chọn ID. Chưa thêm API tạo/sửa/xóa hãng; database mới trống cần được nhập hãng ở bài quản trị hãng trước khi tạo TV.
- POST/PUT nhận BrandId: Range chặn thiếu/không dương; controller tra database, trả 400 có lỗi BrandId nếu hãng không tồn tại. FK là lớp bảo đảm cuối cùng của database.
- GET Products dùng Include để tải hãng. ProductResponse trả các trường cũ, giữ brand là tên hãng và thêm brandId.
- ProductResponse.FromProduct chỉ chuyển entity sang DTO, không tự query. GET đã Include hãng; POST gán Brand từ đối tượng hãng vừa tìm thấy.

Cập nhật sau bài Include/Select: GET hiện dùng Select trực tiếp new ProductResponse trong truy vấn thay cho Include và FromProduct. EF tự JOIN lấy tên hãng, chỉ chọn các cột DTO; không materialize entity nên bỏ AsNoTracking ở hai GET này. POST vẫn dùng FromProduct. Các dòng phía trên mô tả phiên bản đầu của bài migration.

```json
{
  "name": "Samsung TV 55 inch",
  "brandId": 2,
  "price": 11990000,
  "stock": 12
}
```

Request cũ chỉ có `brand` sẽ bị 400 vì thiếu BrandId hợp lệ. Khi chạy lại project, gửi GET /api/brands trong nothing.http, đặt @brandId theo hãng muốn chọn, rồi thử POST/PUT và GET.

## Kiểm tra đã hoàn thành

- Build thành công; không có model change chưa ghi vào migration.
- Database tạm: Up/Down/Up giữ dữ liệu; unique chặn tên trùng, FK chặn ID sai và xóa hãng có TV.
- Local: đối chiếu đủ ba sản phẩm với dữ liệu trước migration.
- HTTP: GET hãng/sản phẩm/chi tiết, POST 201 và Location, PUT đổi hãng; ID hãng thiếu/sai/không tồn tại trả 400; TV không tồn tại trả 404.
- TV test đã xóa, database tạm đã dọn và phiên kiểm tra 5006 đã dừng.
- Cảnh báo precision Price có từ trước vẫn còn; schema vẫn decimal(18,2). Sẽ xử lý ở bài giá tiền.

Tham khảo: [Quản lý migration EF Core](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/managing).
