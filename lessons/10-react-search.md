# Bài 10: Tìm kiếm từ React tới SQL

Đã thêm form tìm theo tên, nút tìm kiếm và xóa tìm kiếm. API backend đã có Search, không cần migration hay sửa controller.

## Hai loại state

- draftSearch trong useState của ProductsPage: chữ đang gõ, chưa gửi API. Đây là state UI cục bộ.
- search trong Zustand: từ khóa đã áp dụng, dùng chung cho tìm kiếm, chuyển trang và tải lại.

Gõ không gọi API. Submit form (Enter hoặc Tìm kiếm) gọi preventDefault để không reload trang HTML, sau đó searchProducts(draftSearch). Store trim từ khóa, lưu search và gọi loadProducts(1). Có Zustand không có nghĩa mọi state phải đưa vào store.

## Vì sao reset trang?

Đang xem trang 2 của toàn bộ TV, tìm LG chỉ có một kết quả. Giữ page=2 sẽ Skip(2) và trả rỗng dù có TV phù hợp ở trang 1. Vì vậy đổi bộ lọc luôn bắt đầu trang 1. Chuyển trang trong cùng bộ lọc thì giữ search. Tải lại khi lỗi cũng giữ trang/từ khóa đang yêu cầu.

## Request

Axios nhận params { page, pageSize: 2, search: search || undefined }. Axios encode query string, không cần tự nối chuỗi. Từ khóa rỗng thì bỏ tham số search để lấy toàn bộ danh sách.

GET /api/products?page=1&pageSize=2&search=LG

ASP.NET bind Search vào ProductQueryRequest. ProductService Where theo tên trước CountAsync và Skip/Take; totalCount là số TV khớp từ khóa, không phải tổng toàn bộ cửa hàng. Frontend không dùng Array.filter trên hai TV của trang hiện tại.

Backend giới hạn Search 200 ký tự. Input có maxLength=200 giúp nhập đúng nhưng backend vẫn phải validation vì client có thể bị bỏ qua. Input type search không tự gọi API. Bấm dấu x có sẵn trong input chỉ sửa draft; Enter/Tìm kiếm mới áp dụng. Nút Xóa tìm kiếm riêng vừa xóa draft vừa gửi lại trang 1 không có bộ lọc.

## Thử thực tế

1. Tới trang 2, gõ LG: danh sách chưa đổi khi chưa submit.
2. Enter: xem Network, page=1 và search=LG; một TV LG hiện ra.
3. Gõ Samsung nhưng chưa submit: dòng từ khóa áp dụng vẫn LG, đúng với kết quả đang hiển thị.
4. Submit Samsung: hai TV Samsung.
5. Tìm một tên không có: HTTP 200, items rỗng, UI thông báo không tìm thấy; đây không phải lỗi 500.
6. Xóa tìm kiếm: trở về trang 1 toàn bộ TV. Tìm 55 inch rồi chuyển trang: search được giữ trong cả hai request.

Có thể submit từ khóa mới khi request cũ đang chạy: store hủy request cũ, không cho kết quả cũ ghi đè. Chưa có debounce/tìm ngay khi gõ, lọc hãng hoặc đồng bộ query với URL. Các phần đó triển khai từng bước nếu cần.

## Kiểm tra

Build/lint và 6 test store đạt. Test mới kiểm tra reset page, trim, giữ search khi paging/reload và clear. API local kiểm tra LG trả 1 kết quả, từ khóa không khớp trả 0. Chưa chạy UI test trong trình duyệt, người học dùng các bước trên để quan sát trực tiếp.
