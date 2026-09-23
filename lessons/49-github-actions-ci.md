# Bài 49: Continuous Integration với GitHub Actions

## CI giải quyết vấn đề gì?

Chạy được trên máy cá nhân chưa chứng minh repository luôn build được. Ta có thể quên chạy test, máy local còn file cũ, hoặc môi trường của người khác khác máy mình.

CI chạy lại các kiểm tra trong một máy mới của GitHub:

```text
Push / Pull Request
        ↓
GitHub tạo Ubuntu runner sạch
        ↓
Install Node + .NET
        ↓
Frontend lint + tests
        ↓
Backend Release build
        ↓
Publish ASP.NET + React artifact
        ↓
Pass hoặc Fail trên GitHub
```

CI hiện chỉ kiểm tra chất lượng và khả năng đóng gói. Nó chưa tự deploy, nên một commit pass CI không tự thay đổi staging/production.

## Workflow hiện tại

File `.github/workflows/ci.yml` chạy khi:

- push vào `main`;
- mở hoặc cập nhật pull request.

Runner thực hiện:

1. Checkout repository với quyền `contents: read`.
2. Cài .NET 10 và Node 22.
3. `npm ci` để cài đúng dependency lock file.
4. `npm run lint`.
5. `npm test`.
6. `dotnet restore`.
7. `dotnet build -c Release`.
8. `dotnet publish` để chạy target build React và đóng gói cùng ASP.NET.
9. Kiểm tra artifact có `nothing.dll` và `wwwroot/index.html`.

`concurrency` tự hủy run cũ trên cùng branch khi có commit mới, tránh tốn runner cho kết quả đã lỗi thời. Timeout 15 phút ngăn job bị treo vô hạn.

## Vì sao dùng `npm ci`?

`npm ci` yêu cầu `package-lock.json`, cài dependency đúng lock file và phù hợp cho môi trường tự động. `npm install` có thể cập nhật lock file hoặc tạo dependency tree khác ngoài ý muốn.

## Vì sao build cấu hình Release?

Release gần artifact deploy hơn Debug. Lỗi chỉ xuất hiện trong cấu hình publish cần được phát hiện trước khi merge/deploy.

## Giới hạn hiện tại

Các integration script dùng SQL Server local và PowerShell chưa chạy trong Ubuntu CI. Chúng vẫn được chạy local cho các thay đổi nghiệp vụ. Để đưa chúng vào CI cần một SQL Server service container, schema/migration setup, dữ liệu cô lập và cleanup đáng tin cậy; phần đó sẽ làm riêng, không nhét vội vào workflow đầu tiên.

Workflow cũng chưa:

- upload artifact để tải về;
- deploy staging/production;
- chạy browser E2E;
- kiểm tra migration trên database tạm;
- lưu secret cloud.

## Kiểm chứng local

Chuỗi lệnh tương đương workflow đã đạt:

- npm audit: 0 vulnerability;
- frontend lint;
- 10 test files, 51 tests;
- backend Release build: 0 warning/error;
- publish chạy Vite production build;
- artifact có backend DLL và React index.

Kết quả runner GitHub được xem trong tab **Actions** của repository.
