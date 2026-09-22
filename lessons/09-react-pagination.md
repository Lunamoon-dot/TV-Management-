# Bài 9: Bấm phân trang trên React, truy vấn trang mới ở SQL

## Kết quả

React có Trang trước/Trang sau. API client gửi page động và pageSize=2 để thấy hai trang với 3 TV mẫu. Backend không đổi. Bài 8 mô tả phiên bản ban đầu chỉ lấy trang 1; từ bài này page đã thay đổi theo thao tác người dùng.

## Theo dõi code

1. ProductsPage: nút Trang sau gọi loadProducts(result.data.page + 1).
2. Store: loadProducts nhận page, lưu requestedPage và đặt loading, hủy request cũ nếu còn.
3. API: getProducts(signal, page) gọi Axios với params { page, pageSize: 2 }.
4. ASP.NET bind query string vào ProductQueryRequest. Service dùng Skip((Page - 1) * PageSize).Take(PageSize).
5. API trả items + totalCount + page + pageSize. Store ghi success/data; React render trang vừa nhận.

Với 3 TV và pageSize=2: trang 1 Skip(0).Take(2), trang 2 Skip(2).Take(2) chỉ còn 1 TV. Frontend không tải hết rồi slice. SQL chọn nhóm bản ghi cần trả; tên hai Samsung giống nhau nhưng ID khác.

Tổng số trang = Math.ceil(totalCount / pageSize). 3 / 2 = 1.5, làm tròn lên là 2. Giao diện dùng tối thiểu 1 để không hiển thị Trang 1/0 khi không có dữ liệu. Trang trước bị vô hiệu ở trang 1; Trang sau bị vô hiệu khi page * pageSize >= totalCount. Trong lúc loading chỉ hiện thông báo, chưa hiện điều hướng; nút Tải lại bị vô hiệu.

## Vì sao có requestedPage?

result.data.page là trang backend đã trả thành công. requestedPage là trang người dùng đang yêu cầu; nó vẫn tồn tại khi result chuyển sang error. Nếu tải trang 2 lỗi rồi bấm Tải lại, loadProducts() mặc định đọc requestedPage và thử lại trang 2, không nhảy về 1. Khi refresh browser, store không persist nên về trang 1. Đồng bộ page vào URL/bookmark sẽ là một bước riêng khi có router.

## Thực hành trong Network

Bật backend profile http và frontend npm run dev. Network → Fetch/XHR:
- Mở trang: page=1&pageSize=2, hai TV.
- Trang sau: page=2&pageSize=2, TV còn lại.
- Trang trước: page=1&pageSize=2.
- Ở trang 2, Tải lại vẫn gọi page=2.

Đặt breakpoint ở ProductsController.Get, xem request.Page/ PageSize; đi vào service để xem công thức Skip/Take. Đây là cùng endpoint, chỉ tham số khác.

pageSize=2 là lựa chọn demo ở frontend; default 20 của backend vẫn giữ, vì frontend đã gửi giá trị cụ thể nên backend dùng 2. Khi có thêm dữ liệu ta có thể nâng pageSize mà không đổi cơ chế.

## Kiểm tra và phạm vi

Build/lint và 5 test store đạt, gồm retry giữ trang và chống response cũ ghi đè. Chưa có UI test tự động. Không sửa dữ liệu, không thêm filter/form/router ở bài này. Phân trang dựa trên thứ tự ID ổn định; nếu dữ liệu thay đổi đồng thời giữa các lần đọc, trang có thể thay đổi — chưa triển khai snapshot/cursor pagination.
