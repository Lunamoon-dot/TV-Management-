# Bài 43 — Publish React cùng ASP.NET Core

Trong development có hai server:

```text
Browser → Vite :5173
             └─ proxy /api → ASP.NET :5005
```

Vite proxy chỉ phục vụ lúc phát triển. Bản production của bài này dùng **same origin**:

```text
Browser → ASP.NET Core
            ├─ /api/*       → Controllers
            ├─ /health/*    → Health checks
            └─ các route UI → React index.html/static assets
```

Cookie Identity, CSRF cookie và API cùng một origin nên không cần mở CORS hoặc chuyển cookie sang chế độ cross-site.

## Build frontend trong dotnet publish

Project `.csproj` khai báo `SpaRoot` và target `PublishFrontend`. Khi chạy:

```powershell
dotnet publish nothing\nothing.csproj -c Release -o publish
```

MSBuild thực hiện:

1. publish ASP.NET Release;
2. chạy `npm ci` từ `package-lock.json`;
3. chạy `npm run build`;
4. copy `frontend/dist/**` vào `wwwroot/**` của artifact publish.

`npm ci` phù hợp pipeline vì nó cài đúng dependency trong lock file và bắt lỗi khi `package.json` không đồng bộ với lock file.

Không commit bundle có hash vào Git. Mỗi lần publish tạo lại artifact từ source và lock file.

## Static files và SPA fallback

ASP.NET pipeline thêm:

```csharp
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHealthChecks(...);
app.Map("/api/{**path}", () => Results.NotFound());
app.MapFallbackToFile("index.html");
```

`UseDefaultFiles` ánh xạ `/` tới `index.html`; `UseStaticFiles` phục vụ JS/CSS đã build.

React Router cần fallback: khi người dùng refresh `/products/1`, server không có file vật lý đó nên trả `index.html`; React đọc URL và render đúng page.

Route `/api/{**path}` được đặt trước fallback để API sai vẫn trả `404`. Nếu bỏ nó, một request nhầm `/api/does-not-exist` có thể nhận HTML với status 200, khiến Axios báo lỗi parse khó hiểu.

## Development không thay đổi

`npm run dev` vẫn dùng Vite `5173` và proxy API tới `5005`. `dotnet build` không bắt buộc Node build; frontend chỉ được đóng gói trong `dotnet publish`.

Axios đã dùng `baseURL: '/api'`, nên cùng code hoạt động ở cả hai chế độ:

- development: Vite proxy `/api`;
- production: request `/api` cùng host ASP.NET.

## Chạy artifact đúng thư mục

Process cần chạy với thư mục publish làm working directory:

```powershell
cd publish
dotnet nothing.dll
```

ASP.NET dùng working directory làm Content Root để tìm `wwwroot`. Gọi DLL từ một thư mục khác mà không cấu hình content root có thể làm static files không được tìm thấy.

Trong deploy thật, reverse proxy/platform cung cấp HTTPS công khai rồi chuyển traffic tới cổng nội bộ của ASP.NET. `ConnectionStrings__DefaultConnection` được cấp bằng secret/environment variable, không đóng vào artifact.

## Những gì đã kiểm tra

- `dotnet build` đạt, không warning/error.
- `dotnet publish -c Release` tự chạy `npm ci` và Vite production build.
- Artifact chứa `wwwroot/index.html`, JS và CSS có hash.
- Chạy artifact với `ASPNETCORE_ENVIRONMENT=Production` thành công.
- `/`, `/products/1`, `/admin/orders/123` đều trả React index.
- `/api/products` vẫn trả JSON.
- `/api/does-not-exist` trả `404`, không trả HTML.
- `/health/live` vẫn truy cập được.
- Không đổi database nên không có migration.

Bài này tạo artifact deploy được nhưng chưa chọn hosting provider hoặc tạo container. Bước deploy kế tiếp sẽ quyết định nơi chạy ASP.NET và SQL Server cloud, sau đó cấu hình HTTPS, secret và migration pipeline theo nền tảng đó.
