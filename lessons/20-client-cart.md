# Bài 20: Giỏ hàng frontend trước khi tạo order thật

## Mục tiêu

Bài này thêm giỏ hàng ở React bằng Zustand. Đây là bước đầu của luồng khách hàng:

```txt
Danh sách TV
    ↓
Thêm vào giỏ
    ↓
Xem giỏ hàng
    ↓
Chỉnh số lượng
    ↓
Bài sau: gửi order lên backend
```

Ở bài này chưa ghi giỏ hàng vào SQL Server. Giỏ hàng chỉ nằm trong memory của frontend, nên reload trang sẽ mất. Điều đó có chủ ý: ta học trước state và UI, sau đó mới đưa phần giao dịch thật vào backend.

## Vì sao không tạo order luôn?

Trong app bán hàng, giỏ hàng ở frontend chỉ là ý định của user. Nó không đáng tin để tính tiền thật.

Frontend có thể gửi:

```json
{
  "productId": 1,
  "quantity": 2,
  "price": 1
}
```

Nếu backend tin giá từ frontend thì user có thể tự sửa request và mua TV giá 1 đồng. Vì vậy bài sau backend phải tự đọc lại sản phẩm từ SQL Server, tự lấy giá hiện tại hoặc snapshot giá hợp lệ, tự kiểm tra tồn kho và tự tạo order.

Flow đúng sẽ là:

```txt
React gửi productId + quantity
    ↓
ASP.NET đọc Product từ SQL Server
    ↓
Backend kiểm tra stock
    ↓
Backend tính giá
    ↓
Backend dùng transaction tạo Order + OrderItems
    ↓
Backend trừ tồn kho
```

## Store giỏ hàng

File mới:

```txt
frontend/src/features/cart/stores/cart-store.ts
```

Store có:

```ts
items
addProduct(product)
updateQuantity(productId, quantity)
removeProduct(productId)
clear()
```

Mỗi item lưu snapshot:

```ts
{
  productId,
  name,
  brand,
  price,
  stock,
  quantity
}
```

Snapshot này giúp UI hiển thị nhanh trong giỏ hàng. Nhưng nhắc lại: khi đặt hàng thật, backend không được tin snapshot này.

## Quy tắc hiện tại

Khi thêm sản phẩm:

```txt
stock <= 0 -> không thêm
chưa có trong giỏ -> thêm quantity = 1
đã có trong giỏ -> tăng quantity, nhưng không vượt stock
```

Khi sửa số lượng:

```txt
quantity < 1 -> ép về 1
quantity > stock -> ép về stock
```

Đây là validation UX ở client. Backend vẫn phải kiểm tra lại ở bài order.

## UI đã thêm

Navbar có:

```txt
Giỏ hàng (số lượng)
```

Danh sách và chi tiết TV có nút:

```txt
Thêm vào giỏ
```

Trang mới:

```txt
/cart
```

Trang này cho xem item, chỉnh số lượng, xóa item, xóa toàn bộ và xem tổng tạm tính.

Nút `Đặt hàng` đang bị disabled vì chưa có backend order. Đây là ranh giới bài học:

```txt
Cart frontend = chọn sản phẩm
Order backend = giao dịch mua hàng thật
```

## So với React + Express

Nếu bạn từng làm Express, phần này giống:

```txt
Zustand cart store
    ↓
POST /api/orders
    ↓
Express controller
    ↓
MongoDB transaction hoặc session
```

Trong ASP.NET + SQL Server, bài sau sẽ tương đương:

```txt
React cart store
    ↓
POST /api/orders
    ↓
OrdersController
    ↓
EF Core transaction
    ↓
SQL Server Order + OrderItems + Product stock
```

Điểm khác lớn là SQL quan hệ sẽ buộc ta nghĩ kỹ hơn về khóa ngoại, transaction và snapshot giá.

## Điều cần nhớ

Không bao giờ tin:

```txt
price từ frontend
stock từ frontend
role từ frontend
total từ frontend
```

Frontend giúp người dùng thao tác dễ. Backend quyết định dữ liệu nào được lưu.
