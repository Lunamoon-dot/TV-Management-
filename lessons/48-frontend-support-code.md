# Bài 48: đưa Correlation ID tới người dùng dưới dạng mã hỗ trợ

## Luồng điều tra lỗi hoàn chỉnh

Bài 46 tạo correlation ID ở backend, bài 47 đưa ID vào logging scope. Bài này nối phần còn lại ở React:

```text
Customer bấm Đặt hàng
        ↓
API xảy ra lỗi không dự đoán được
        ↓
Response: X-Correlation-ID: abc123
        ↓
Axios error.response.headers
        ↓
React: "Chưa tạo được đơn. Mã hỗ trợ: abc123"
        ↓
Admin tìm abc123 trong server logs
```

Mã hỗ trợ không giải thích nguyên nhân cho khách hàng. Nó là khóa để đội vận hành tìm đúng request mà không hiển thị exception hoặc stack trace.

## Helper dùng chung

`shared/api/errors.ts` có hai hàm mới:

```ts
getCorrelationId(error)
withSupportCode(message, error)
```

Axios chuẩn hóa tên response header về chữ thường, vì vậy frontend đọc:

```ts
error.response?.headers['x-correlation-id']
```

Nếu request không tới server, ví dụ mất mạng hoặc DNS lỗi, không có HTTP response và không có correlation ID. Helper giữ nguyên message thay vì tạo mã giả.

## Áp dụng vào checkout

Checkout chỉ thêm mã cho lỗi không dự đoán được:

```ts
setError(withSupportCode(
  'Chưa tạo được đơn hàng. Giỏ hàng vẫn được giữ nguyên để bạn thử lại.',
  requestError,
))
```

Các lỗi có cách xử lý rõ vẫn giữ UX riêng:

- `400`: báo giá, sản phẩm hoặc tồn kho đã thay đổi.
- `401`: đưa về trang đăng nhập.
- Lỗi không dự đoán được có response: hiện mã hỗ trợ.
- Lỗi mạng không có response: chỉ hiện thông báo thử lại.

Không nên hiện mã hỗ trợ cho mọi validation nhỏ vì sẽ tạo nhiễu và khiến người dùng nghĩ lỗi nhập liệu là lỗi hệ thống.

## Cách thử thủ công

1. Mở DevTools → Network.
2. Thực hiện một API request.
3. Chọn response và xem `X-Correlation-ID`.
4. Tìm ID đó trong console backend.

Khi checkout gặp lỗi server, cùng mã sẽ xuất hiện trên UI. Trong Production sau này, nhân viên hỗ trợ có thể tìm mã trong hệ thống log tập trung.

## Kiểm chứng

- Frontend lint và production build đạt.
- 10 test files, 51 tests đạt.
- Test xác nhận đọc đúng header, ghép mã vào message và không tạo mã khi response không có header.
- Backend/database không thay đổi trong bài này.
