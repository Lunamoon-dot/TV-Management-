# Bài 51: đóng gói React + ASP.NET bằng Docker

## Docker giải quyết vấn đề gì?

Artifact `dotnet publish` vẫn phụ thuộc máy chủ có đúng .NET runtime và cách copy file. Docker image đóng gói runtime cùng artifact thành một đơn vị có thể chạy giống nhau ở local, staging và production.

```text
Source code
    ↓ docker build
Immutable image
    ↓ docker run / cloud platform
Container chạy ASP.NET + React
```

Image không chứa SQL Server. Container nhận connection string để kết nối database bên ngoài.

## Multi-stage Dockerfile

Dockerfile có ba stage:

### 1. Frontend build

```text
node:22-alpine
  npm ci
  npm run build
  → /src/frontend/dist
```

### 2. Backend build

```text
mcr.microsoft.com/dotnet/sdk:10.0
  dotnet restore
  dotnet publish
  → /app/publish
```

Property `BuildFrontend=false` ngăn target trong `.csproj` chạy Node lần thứ hai. Docker đã có frontend stage riêng.

### 3. Runtime image

```text
mcr.microsoft.com/dotnet/aspnet:10.0
  backend publish output
  React dist → wwwroot
  run dotnet nothing.dll
```

Stage cuối chỉ có ASP.NET runtime và file cần chạy. Nó không mang theo Node, npm cache, .NET SDK hoặc source code nên image nhỏ và giảm bề mặt tấn công.

Ứng dụng chạy bằng `$APP_UID`, không chạy bằng root, và lắng nghe cổng `8080` trong container.

## Build và chạy khi đã cài Docker

Build image:

```powershell
docker build -t tv-store:local .
```

Tạo volume bền vững cho Data Protection keys:

```powershell
docker volume create tvstore-keys
```

Đặt cấu hình nhạy cảm trong file `.env` local đã được Git ignore:

```text
ConnectionStrings__DefaultConnection=<production-or-staging-connection-string>
DataProtection__KeysPath=/keys
```

Chạy container:

```powershell
docker run --rm `
  --name tv-store `
  --env-file .env `
  -p 8080:8080 `
  -v tvstore-keys:/keys `
  tv-store:local
```

Sau đó kiểm tra:

```text
http://localhost:8080/health/live
http://localhost:8080/
```

Không commit `.env`, connection string hoặc key XML.

## Lưu ý SQL Server từ container

`localhost` bên trong container là chính container, không phải Windows host. Nếu thử SQL Server đang chạy trên máy Windows, thường dùng `host.docker.internal` và SQL authentication phù hợp. `Trusted_Connection=True` của Windows local không hoạt động nguyên trạng từ Linux container.

Ở staging/production, connection string sẽ trỏ tới SQL Server/Azure SQL bên ngoài container và được cấp bằng secret của nền tảng.

## `.dockerignore`

Build context loại bỏ `.git`, IDE state, `bin/obj`, `node_modules`, `dist`, test output và tài liệu. Điều này giúp build nhanh hơn và tránh vô tình đưa file local vào image.

## Data Protection và container

Production vẫn yêu cầu `DataProtection__KeysPath`. Mount volume vào `/keys` giữ cookie key qua restart/redeploy. Nếu bỏ volume, key nằm trong writable layer của container và mất khi container bị thay thế.

## Kiểm chứng

Máy local hiện chưa có lệnh Docker, nên không giả vờ rằng container đã chạy local. Các kiểm tra local đã đạt:

- Release solution build sạch.
- 12 backend unit tests đạt.
- Publish thông thường vẫn build React và chứa `wwwroot/index.html`.

GitHub Actions có bước `docker build --tag tv-store:ci .` để xác nhận Dockerfile trên Docker runner thật. Chưa push image lên container registry và chưa deploy.
