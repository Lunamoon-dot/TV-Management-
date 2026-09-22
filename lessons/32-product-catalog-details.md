# Bài 32 — Ảnh và thông số TV

Catalog trước đây chỉ có tên, hãng, giá và tồn kho. Bài này đưa ba thuộc tính xuyên suốt hệ thống:

- `ImageUrl`: địa chỉ ảnh dùng HTTP/HTTPS;
- `ScreenSizeInches`: kích thước màn hình, lưu `decimal(5,1)`;
- `Resolution`: nhãn độ phân giải như `4K UHD`.

## Luồng dữ liệu

```text
Form Admin + Zod
  → Create/UpdateProductRequest
  → ProductsController
  → Product entity
  → Products table
  → ProductResponse
  → Card và trang chi tiết Customer
```

Một field phải được thêm vào mọi điểm cần thiết. Chỉ sửa entity sẽ làm database chưa có cột; chỉ sửa DTO sẽ không lưu; chỉ sửa React type sẽ không khiến API trả dữ liệu.

## Nullable trong entity, required trong request

Ba cột mới nullable vì database đã có TV cũ không mang thông số này. Migration không tự đoán ảnh, kích thước hoặc độ phân giải. Customer UI hiển thị placeholder cho dữ liệu cũ.

Request tạo/sửa lại bắt buộc ba trường. Điều đó có nghĩa sản phẩm được Admin lưu từ bây giờ phải hoàn chỉnh hơn, nhưng migration vẫn an toàn với dữ liệu legacy.

## Decimal cho kích thước

`ScreenSizeInches` dùng `decimal?` và SQL `decimal(5,1)`, đủ biểu diễn `55.5` chính xác. Giá tiền tiếp tục dùng `decimal(18,2)`. Không nên dùng `float` cho dữ liệu thập phân cần quy tắc số chữ số rõ ràng.

## URL ảnh chưa phải upload ảnh

Hiện backend chỉ lưu URL và kiểm tra scheme HTTP/HTTPS; file ảnh nằm ở nơi khác. Bản production nên upload qua backend hoặc signed URL tới object storage, giới hạn loại/kích thước file rồi lưu metadata. Bài này chưa thêm object storage vì sẽ kéo theo hạ tầng cloud trước khi cần.

## Kiểm tra

Integration test xác nhận request sai bị `400`, request đúng được lưu trong SQL và GET trả lại đủ ba field. Frontend dùng Zod để báo lỗi sớm, còn backend vẫn validate độc lập.
