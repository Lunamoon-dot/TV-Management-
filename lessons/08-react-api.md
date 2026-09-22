# Bài 8: React + Zustand + Axios + Tailwind CSS

## Cấu trúc hiện tại

```text
frontend/src/
  app/App.tsx
  features/products/
    api/products.ts
    components/ProductCard.tsx
    pages/ProductsPage.tsx
    stores/product-store.ts
    stores/product-store.test.ts
    types.ts
  shared/api/http.ts
  main.tsx
  index.css
```

Tổ chức theo tính năng: code của Products ở cùng một chỗ. Khi triển khai Orders/Auth sẽ có feature tương ứng. shared chỉ chứa phần dùng chung thật sự; không tạo sẵn nhiều folder rỗng. App ghép các màn hình, sau này là nơi nối router khi có nhiều trang. Hiện chưa cần thư viện router.

## Vai trò và luồng

ProductsPage → action loadProducts trong Zustand → getProducts → Axios instance → Vite proxy → ProductsController → ProductService → EF/SQL → JSON → store cập nhật result → React render ProductCard.

- shared/api/http.ts: Axios instance, baseURL /api, timeout 15 giây.
- features/products/api/products.ts: endpoint /products, params page=1/pageSize=20; trả response.data.
- types.ts: kiểu JSON tương ứng DTO backend, không phải runtime validation.
- stores/product-store.ts: dữ liệu và trạng thái tải, action gọi API, xử lý lỗi, hủy request cũ.
- pages/ProductsPage.tsx: subscribe từng selector, gọi action khi mount, render loading/error/empty/success.
- components/ProductCard.tsx: nhận product qua props và hiển thị, không gọi API hoặc đọc store.
- index.css: import Tailwind và style nền; layout/style component dùng utility classes.

Axios mặc định reject HTTP ngoài 2xx, khác fetch phải kiểm tra response.ok. JSON nằm trong response.data; không gọi response.json(). Chưa có interceptor auth/refresh vì chưa triển khai Identity.

Store dùng discriminated union cho result để data chỉ có khi success, message chỉ có khi error. Request mới abort request cũ; kiểm tra signal trước khi set để response cũ không ghi đè mới. Khi unmount, cancelLoad hủy tác vụ. StrictMode development có thể setup/cleanup effect thêm một lần, nên thấy request cancelled trong Network không nhất thiết là lỗi.

Store này phục vụ một màn hình catalog, chưa phải cache server tự động: chưa deduplicate nhiều consumer, chưa tự revalidate hoặc persist. Dữ liệu SQL vẫn là nguồn chính; F5 sẽ tải lại API. State UI riêng của component trong tương lai vẫn có thể dùng useState, không bắt buộc đưa hết vào Zustand.

## Chạy thực hành

Từ thư mục solution: chạy API bằng Visual Studio profile http hoặc:

```powershell
dotnet run --project nothing/nothing.csproj --launch-profile http
```

Terminal khác:

```powershell
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173. Vite proxy /api tới http://localhost:5005. Dùng profile http để tránh redirect HTTPS ngoài proxy. Nếu đổi cổng API, copy .env.example thành .env.local rồi sửa API_PROXY_TARGET và restart Vite.

1. Mở Network → Fetch/XHR, xem products?page=1&pageSize=20, response.items.
2. Đặt breakpoint ở controller Get, bấm Tải lại: UI loading, request pending. Continue để nhận danh sách.
3. Dừng backend rồi Tải lại: UI báo lỗi (proxy có thể trả 502), không được báo danh sách rỗng.
4. Bật API lại rồi Tải lại để phục hồi. Không xóa dữ liệu DB để thử empty state.

Hiện chỉ đọc trang đầu tối đa 20 TV, chưa thêm bộ lọc/form/auth. Vite proxy chỉ dùng lúc dev; build dist không chứa proxy đang chạy. Deploy cần cấu hình reverse proxy /api hoặc origin/CORS phù hợp. Không đưa SQL credentials vào frontend.

## Kiểm tra

npm run build: TypeScript + Vite/Tailwind. npm run lint: kiểm tra code. npm test: success rỗng, HTTP error/retry, race response cũ và cancellation. Test store mock API, không truy cập hoặc sửa SQL; không thay thế kiểm tra giao diện/browser.

Tài liệu:
- https://zustand.docs.pmnd.rs/reference/apis/create
- https://axios-http.com/docs/cancellation
- https://tailwindcss.com/docs/installation/using-vite
