# Bài 12: Route React và route ASP.NET qua trang chi tiết

## Kết quả

Tên TV trên card là Link tới /products/{id}. App khai báo BrowserRouter/Routes, màn hình chi tiết dùng useParams rồi Axios GET /api/products/{id}. Route không có màn hình hiển thị Trang không tồn tại. Backend và DB giữ nguyên.

## Hai loại URL

http://localhost:5173/products/3 là URL giao diện. React Router khớp /products/:id và render ProductDetailsPage. useParams() trả { id: '3' }, kiểu chuỗi. Code kiểm tra chữ số, chuyển Number, kiểm tra số dương trong phạm vi int C#. ID sai định dạng như abc không gọi API.

http://localhost:5173/api/products/3 là URL request dữ liệu. Axios instance baseURL=/api kết hợp /products/3. Vite chuyển tiếp sang ASP.NET localhost:5005. ASP.NET khớp [HttpGet("{id:int}")], bind int id=3, truy vấn SQL và trả DTO.

React không tự biết route C#; hai phía được nối bởi getProductById. Trình duyệt hiển thị tên/id không đủ để có dữ liệu: vẫn phải gọi API.

## Đọc code theo thứ tự

1. main.tsx: BrowserRouter bao App để các Link/useParams có context router.
2. app/App.tsx: / là ProductsPage, /products/:id là ProductDetailsPage, * là fallback.
3. ProductCard: Link to={`/products/${product.id}`}; Link điều hướng client-side, thường không tải lại toàn bộ document.
4. ProductDetailsPage: đọc id, kiểm tra hợp lệ, render ProductDetails key={productId}.
5. getProductById: http.get<ProductResponse>(`/products/${id}`, { signal }); trả response.data.
6. Controller GetById: EF đọc bằng ID, không có trả NotFound(), có trả Ok(dto).
7. Component cập nhật local state và hiển thị.

key theo ID giúp tạo lại phần dữ liệu chi tiết khi ID đổi, tránh hiện TV cũ dưới URL mới. Cleanup abort request cũ. Chi tiết chỉ dùng ở màn hình này nên state cục bộ; danh sách/filter dùng Zustand và được giữ khi đi chi tiết rồi quay lại bằng Link. Refresh toàn bộ browser khởi tạo lại store, chưa persist/query URL.

## Vì sao không lấy luôn từ danh sách đã tải?

Người dùng có thể dán URL /products/3 vào tab mới, lúc đó danh sách chưa được tải. Sản phẩm cũng có thể nằm ở trang khác hoặc thay đổi sau khi đọc danh sách. Gọi endpoint chi tiết giúp URL hoạt động độc lập.

## Lỗi khác nhau

- /products/abc: URL có ID sai định dạng, frontend báo địa chỉ không hợp lệ.
- /products/2147483647: ID hợp lệ nhưng không có trong dữ liệu mẫu, API trả 404, UI báo không tìm thấy.
- API không hoạt động hoặc 500/502/timeout: báo không tải được, có Thử lại. Không gộp với 404.
- /duong-dan-khong-co: React Router hiển thị Trang không tồn tại.

Fallback giao diện trong SPA không tự đổi HTTP status của document HTML thành 404. Tương tự, API 404 là status của request dữ liệu, không phải status tải index.html.

## Thực hành

Chạy API http và npm run dev như trước. Bấm tên một TV, nhìn URL. Network có request /api/products/{id}. Đặt breakpoint GetById để xem id.

Dán http://localhost:5173/products/3 vào tab mới hoặc F5 trên trang chi tiết: vẫn tải được qua API. Vite dev hỗ trợ SPA fallback; khi deploy cần server trả index.html cho route frontend, nhưng /api phải chuyển backend, không trả HTML. Đây là cấu hình hosting cần làm ở giai đoạn deploy.

Thử các URL lỗi ở trên. Bấm Về danh sách TV để trở lại. Chưa có form sửa/mua hàng hay thông số TV ngoài DTO hiện có.

## Kiểm chứng

Build/lint đạt, 7 test store cũ vẫn đạt. API thật: ID 3 trả LG, ID không tồn tại trả 404. Chưa chạy kiểm thử giao diện/browser tự động cho routing; thực hành bằng các bước trên.

Tài liệu: https://reactrouter.com/start/declarative/routing
