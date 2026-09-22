# React + ASP.NET — bài 8

Từ thư mục backend, chạy profile http (localhost:5005). Trong thư mục frontend:

```powershell
npm install
npm run dev
```

Mở http://localhost:5173. Vite chuyển tiếp /api tới http://localhost:5005. Nếu API dùng địa chỉ khác, copy .env.example thành .env.local và sửa API_PROXY_TARGET, sau đó khởi động lại Vite.

Để chạy backend từ thư mục solution:

```powershell
dotnet run --project nothing/nothing.csproj --launch-profile http
```

Dùng profile http cho bài này để tránh redirect sang HTTPS bên ngoài proxy. Chỉ GET trang đầu, tối đa 20 TV; chưa có nút phân trang/form ghi dữ liệu/auth.

npm run build kiểm tra TypeScript và tạo dist. npm run lint kiểm tra mã. Vite dev proxy không được đóng gói vào dist; khi deploy cần reverse proxy /api tới backend hoặc cấu hình API origin và CORS phù hợp. Không dùng npm run preview làm server production.

Xem ../lessons/08-react-api.md để theo dõi luồng request.

## Tổ chức code

Stack: React + TypeScript + Zustand + Axios + Tailwind CSS. src/app ghép màn hình; src/features/products chứa API/types/store/page/component của catalog; src/shared/api/http.ts cấu hình Axios dùng chung. npm test kiểm tra store (mock API). Xem bài 8 để biết vai trò từng file và luồng request.

Bài 9 cập nhật: danh sách đã có Trang trước/Trang sau, 2 TV mỗi trang để thực hành; xem ../lessons/09-react-pagination.md.

Bài 12: bấm tên TV để tới /products/:id. Khi deploy cần SPA fallback cho route frontend; /api phải tới backend. Xem ../lessons/12-react-product-details.md.

Bài 13: /products/new tạo TV vào DB local. Thành công mở chi tiết; 400 hiển thị validation. API ghi chưa có phân quyền, dùng local cho tới bài Identity. Xem ../lessons/13-react-create-product.md.

Bài14: trang chi tiết có Sửa TV, route /products/:id/edit, form chung ProductForm và PUT. Xem ../lessons/14-react-edit-product.md.
