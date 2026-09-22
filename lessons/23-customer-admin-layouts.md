# Bài 23 — Tách website Customer và khu Admin

Customer và Admin vẫn là một React application, nhưng được chia thành hai cây route và hai layout riêng. Đây là cách tổ chức phù hợp khi chúng dùng chung domain, hệ thống đăng nhập và API nhưng có mục tiêu sử dụng khác nhau.

```text
App
├── CustomerLayout
│   ├── /                         catalog
│   ├── /products/:id             chi tiết TV
│   ├── /cart                     giỏ hàng
│   ├── /orders/:id/confirmation xác nhận đơn
│   ├── /login
│   └── /register
│
└── RequireAdmin
    └── AdminLayout
        ├── /admin
        ├── /admin/products
        ├── /admin/products/new
        └── /admin/products/:id/edit
```

## 1. Layout là gì?

Layout là khung dùng chung cho một nhóm trang. `CustomerLayout` chứa thanh điều hướng cửa hàng và `<Outlet />`. `AdminLayout` chứa sidebar quản trị, thông tin Admin, đăng xuất và `<Outlet />`.

`<Outlet />` là vị trí React Router render route con đang khớp. Vì vậy `AdminLayout` không cần biết đang mở danh sách, tạo hay sửa sản phẩm.

## 2. Route lồng nhau

Các route Customer là con của route dùng `CustomerLayout`. `/admin` được bọc bởi `RequireAdmin`, rồi mới render `AdminLayout` và các trang quản trị con.

`RequireAdmin` trên frontend phục vụ điều hướng và UX:

- Chưa đăng nhập: chuyển tới login.
- Đăng nhập nhưng không có role Admin: từ chối giao diện quản trị.
- Có role Admin: render layout và route con.

Đây không phải lớp bảo mật cuối cùng. Người dùng có thể sửa JavaScript hoặc gọi API trực tiếp, nên backend vẫn cần `[Authorize(Roles = "Admin")]` trên POST/PUT/DELETE Product.

## 3. Customer không còn chứa thao tác quản trị

Catalog Customer không hiện “Thêm TV”. Trang chi tiết Customer không hiện “Sửa TV”. Nếu tài khoản có role Admin, thanh cửa hàng chỉ hiện một link “Khu quản trị” để chuyển sang giao diện khác.

Các trang tạo/sửa giữ lại logic API, Zod và error handling đã học, nhưng đường dẫn và điều hướng sau submit đều nằm trong `/admin/products/...`.

## 4. State của hai khu vực

Danh sách Customer dùng Zustand store vì search, hãng và phân trang phải được chia sẻ giữa các component catalog. Danh sách Admin dùng state riêng và request không có bộ lọc Customer. Nhờ vậy từ khóa vừa tìm ngoài cửa hàng không vô tình làm danh sách quản trị bị lọc.

Hiện Admin có dashboard và bảng sản phẩm đầu tiên. Những module Order, Brand, Customer, tồn kho sẽ được thêm dần vào cùng `AdminLayout`, không đưa vào layout Customer.
