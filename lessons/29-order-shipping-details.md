# Bài 29 — Thông tin giao hàng khi checkout

Bài này nối thêm một phần dữ liệu thật vào toàn bộ luồng:

```text
Form React
  → Zod kiểm tra và trim
  → Axios gửi CreateOrderRequest
  → ASP.NET bind JSON vào DTO và validate lại
  → Controller tạo Order
  → EF Core INSERT ba cột vào SQL Server
  → OrderResponse trả thông tin cho trang chi tiết
```

## Vì sao lưu trên Order?

`RecipientName`, `PhoneNumber` và `ShippingAddress` là **snapshot giao hàng**. Nếu sau này khách sửa hồ sơ hoặc địa chỉ mặc định, đơn đã đặt vẫn phải giữ đúng thông tin được dùng tại thời điểm checkout.

Hiện chưa cần tạo bảng `Address`. Một bảng địa chỉ riêng hữu ích khi khách muốn lưu nhiều địa chỉ để tái sử dụng, nhưng Order vẫn cần giữ snapshot của chính nó.

## Hai lớp validation

- Zod cho phản hồi nhanh ngay trên form và tạo request đã trim.
- Data Annotations cùng kiểm tra chuỗi trắng trong controller bảo vệ API khi request không đến từ giao diện React.
- Cấu hình EF Core đặt độ dài tối đa và `NOT NULL` cho ba cột SQL.

Frontend validation phục vụ trải nghiệm. Backend validation mới là ranh giới tin cậy.

## Migration

Migration `AddOrderShippingDetails` thêm ba cột `nvarchar` bắt buộc vào `Orders`. Các dòng cũ nhận chuỗi rỗng do migration cần một giá trị khi thêm cột `NOT NULL`; mọi đơn mới bắt buộc có dữ liệu hợp lệ.

## Cách kiểm tra

1. Chạy backend và frontend.
2. Thêm TV vào giỏ rồi mở `/cart`.
3. Thử submit khi để trống để thấy lỗi Zod theo từng trường.
4. Điền thông tin hợp lệ và đặt hàng.
5. Refresh `/orders/{id}` để xác nhận dữ liệu được đọc lại từ SQL, không phụ thuộc state của React.

Bước tiếp theo phù hợp là xử lý submit lặp để double-click hoặc retry mạng không tạo hai đơn giống nhau.
