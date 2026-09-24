# Bài 54: điền sẵn checkout từ hồ sơ khách hàng

## Luồng mới

Khi Customer đã đăng nhập mở giỏ hàng:

```text
CartPage
  → GET /api/account/profile
  → nhận FullName, PhoneNumber, ShippingAddress
  → điền vào các ô checkout đang trống
```

Customer vẫn có thể sửa tên người nhận, số điện thoại hoặc địa chỉ trước khi đặt hàng. Thay đổi trong checkout chỉ áp dụng cho đơn hiện tại và không tự cập nhật hồ sơ.

## Vì sao chỉ điền ô trống?

API chạy bất đồng bộ. Nếu người dùng bắt đầu nhập trước khi response về, việc gán toàn bộ profile sẽ làm mất nội dung họ vừa nhập. Hàm `prefillCheckout` vì vậy dùng giá trị hiện tại trước:

```ts
recipientName: current.recipientName || profile.fullName || ''
```

Quy tắc tương tự áp dụng cho số điện thoại và địa chỉ.

## Profile và Order có vai trò khác nhau

```text
Customer Profile = giá trị mặc định có thể thay đổi
Order snapshot    = thông tin giao hàng tại thời điểm đặt đơn
```

Order không tham chiếu động tới profile. Sau khi đặt hàng, Customer có thể đổi hồ sơ nhưng đơn cũ vẫn giữ đúng người nhận và địa chỉ ban đầu. Đây là yêu cầu quan trọng với lịch sử mua hàng và vận chuyển.

## Khi profile chưa hoàn chỉnh hoặc tải lỗi

- Profile trống: form vẫn trống và có link mở trang hồ sơ.
- GET lỗi: checkout không bị khóa; Customer có thể nhập thủ công.
- Cookie hết hạn: auth store chuyển về trạng thái anonymous và nút đặt hàng yêu cầu đăng nhập.

## Kiểm tra

- Prefill ba trường khi checkout còn trống.
- Không ghi đè ba trường đã được nhập cho đơn hiện tại.
- Frontend đạt 55 test, lint sạch và production build thành công.

