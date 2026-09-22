# Bài 7: Cấu hình và môi trường chạy

## Mục tiêu

Hiểu cách cùng một backend chọn cấu hình khác nhau khi chạy local/staging/production. Bài này dùng code sẵn có, không thêm module, không đổi database. Đây cũng là cơ chế dùng trong bài 6 để thử SQL lỗi bằng một phiên chạy riêng.

## Đọc code hiện tại

Trong nothing/Program.cs:

```csharp
var builder = WebApplication.CreateBuilder(args);
// ...
builder.Configuration.GetConnectionString("DefaultConnection")
```

CreateBuilder thiết lập các nguồn cấu hình mặc định. GetConnectionString đọc khóa ConnectionStrings:DefaultConnection từ cấu hình đã hợp nhất, không cố định đọc riêng appsettings.json. Tương đương cách đọc `builder.Configuration["ConnectionStrings:DefaultConnection"]`.

Thứ tự ưu tiên của các nguồn cấu hình ứng dụng thường dùng, từ thấp đến cao:

1. appsettings.json.
2. appsettings.{Environment}.json.
3. User Secrets trong Development nếu project được cấu hình sử dụng.
4. Biến môi trường.
5. Tham số dòng lệnh.

Khóa trùng được nguồn ưu tiên cao hơn ghi đè. Các khóa khác vẫn giữ giá trị; không thay toàn bộ file JSON. Có thể tùy biến thứ tự provider trong code, nhưng project này dùng mặc định.

Ví dụ appsettings.Development.json hiện chỉ ghi đè Logging. Nó không có ConnectionStrings nên kết nối vẫn có thể lấy từ appsettings.json nếu không có nguồn ưu tiên cao hơn.

## Chuyển từ cách nghĩ Express

Trong Node, bạn thường đọc process.env.DB_CONNECTION; thư viện dotenv có thể nạp file .env vào process.env. Trong .NET, IConfiguration hợp nhất nhiều nguồn và hỗ trợ khóa phân cấp. File .env không tự được đọc chỉ vì đặt nó cạnh project.

Biến môi trường `ConnectionStrings__DefaultConnection` ánh xạ tới khóa `ConnectionStrings:DefaultConnection`. Hai dấu gạch dưới là cách thể hiện phân cấp dùng được trên nhiều hệ điều hành.

PowerShell minh họa (không cần thực hiện để học phần còn lại):

```powershell
$env:ConnectionStrings__DefaultConnection = 'Server=...;Database=...;...'
```

Dấu ... chỉ là placeholder, không phải connection string chạy được. Biến đặt trong terminal chỉ ảnh hưởng terminal đó và các tiến trình con khởi động từ nó, không tự cập nhật phiên API đã chạy trong Visual Studio.

## Environment không phải Debug/Release

Development, Staging, Production là tên môi trường runtime. Debug/Release là cấu hình build. Bản Release vẫn có thể chạy Development nếu môi trường được đặt như vậy.

Trong nothing/Properties/launchSettings.json, cả profile http và https hiện đều đặt ASPNETCORE_ENVIRONMENT=Development. Profile còn chọn URL/cổng chạy local. launchSettings không phải cấu hình hosting production.

Với WebApplication.CreateBuilder, DOTNET_ENVIRONMENT có ưu tiên cao hơn ASPNETCORE_ENVIRONMENT nếu cả hai được đặt khác nhau. Tránh đặt mâu thuẫn. Nếu không đặt môi trường thì mặc định là Production.

Trong Program.cs:

```csharp
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
```

Code này chỉ đăng ký endpoint tài liệu OpenAPI trong Development. Không thay đổi route sản phẩm. Production là nhãn cấu hình, không tự chuyển database lên cloud, không tự thêm auth hay làm API sẵn sàng public.

## Thực hành nhỏ: quan sát bằng hai phiên chạy lần lượt

Từ thư mục solution, mở một terminal PowerShell riêng. Chạy Development:

```powershell
$env:DOTNET_ENVIRONMENT = 'Development'
dotnet run --project nothing/nothing.csproj --no-launch-profile --urls http://localhost:5006
```

Quan sát log Hosting environment: Development. Gửi GET http://localhost:5006/openapi/v1.json; dự kiến 200. Đây là tài liệu JSON, chưa phải giao diện Swagger UI.

Ctrl+C dừng API, rồi chạy:

```powershell
$env:DOTNET_ENVIRONMENT = 'Production'
dotnet run --project nothing/nothing.csproj --no-launch-profile --urls http://localhost:5006
```

Log dự kiến là Production; cùng URL OpenAPI dự kiến 404 vì không đăng ký endpoint. GET /api/products vẫn dùng cấu hình kết nối hiện có; không có database production riêng chỉ vì đổi tên môi trường. Bài tập chỉ gửi GET.

--no-launch-profile bỏ profile local để quan sát môi trường do terminal đặt. Đây là thử runtime local, không phải triển khai production. Nếu project đang chạy khóa file build, dừng phiên debug trước khi chạy. Nếu cổng 5006 đang được dùng, chọn một cổng trống và cập nhật URL tương ứng.

Ctrl+C và đóng terminal thử nghiệm khi xong. Phiên chạy từ Visual Studio vẫn dùng cấu hình profile của nó. Các kết quả trong phần này là kỳ vọng để người học tự quan sát, chưa được ghi nhận là kiểm thử tự động của bài 7.

## Chuẩn bị cho cloud và React

Connection string có mật khẩu không nên commit vào source. Development có thể dùng User Secrets (không được mã hóa và không dùng làm kho secret production); production dùng cơ chế cấu hình/secret của nơi hosting. Project chưa được thay đổi để dùng User Secrets ở bài này.

React chỉ cần địa chỉ API và cấu hình công khai; không đưa SQL connection string vào frontend. Luồng vẫn là React → ASP.NET → SQL. Browser không kết nối trực tiếp SQL Server.

## Tự kiểm tra hiểu bài

- Vì sao lần trước đổi biến môi trường có thể gây lỗi SQL mà không sửa appsettings.json?
- Vì sao đổi Production vẫn có thể truy cập database local?
- Vì sao tên profile https không đồng nghĩa Production?
- Vì sao đổi biến ở terminal không làm API đang chạy ở Visual Studio đổi theo?

Tài liệu:
- https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/?view=aspnetcore-10.0
- https://learn.microsoft.com/en-us/aspnet/core/fundamentals/environments?view=aspnetcore-10.0
