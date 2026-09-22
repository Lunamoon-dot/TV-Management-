# Bài 14: Sửa TV bằng PUT và form dùng chung

## Thực hành

Mở chi tiết một TV → Sửa TV → URL /products/{id}/edit. Màn hình GET dữ liệu hiện tại, điền sẵn form. Sửa tồn kho 10 thành 12 rồi Lưu thay đổi. React PUT đủ bốn trường; backend trả 204; React chuyển chi tiết và GET lại. Khi tự thao tác sẽ thay đổi dữ liệu local thật.

## Form dùng chung

components/ProductForm.tsx được tách từ form tạo đã có. Nó nhận initialValues, submitLabel, failureMessage và onSubmit. Form phụ trách ô nhập, tải hãng, validation Zod, lỗi field, chống bấm gửi lặp. Page phụ trách thao tác API và điều hướng.

CreateProductPage truyền giá trị rỗng và onSubmit gọi createProduct → POST → lấy ID response.
EditProductPage GET trước, truyền giá trị hiện tại và onSubmit gọi updateProduct → PUT → dùng ID URL để điều hướng.

Không cần sao chép schema: CreateProductRequest và UpdateProductRequest backend hiện có cùng bốn trường/quy tắc, nên frontend dùng chung schema hiện tại và type UpdateProductRequest alias. Tên file schemas/create-product.ts được giữ để các bài cũ còn tra được. Nếu contract tạo/sửa khác nhau sau này, mới tách schema tương ứng. Đây không phải giả định mọi POST/PUT luôn giống nhau.

## Vì sao chuyển số lại thành string?

API trả price/stock/brandId dạng số. Form giữ input dạng chuỗi để cho phép người dùng xóa trắng ô trong lúc sửa. initialValues chuyển String(product.stock), v.v. Khi submit, Zod kiểm tra và chuyển lại số. Chuỗi '0' là tồn kho hợp lệ; chuỗi rỗng là chưa nhập.

Form chỉ mount khi GET thành công. useState(initialValues) chỉ khởi tạo lúc mount; không liên tục đồng bộ từ server vì sẽ ghi đè nội dung người dùng đang nhập. Phần EditProduct có key theo ID, nên đổi ID sẽ tạo lại trạng thái phù hợp.

## PUT khác POST trong code

```ts
export async function updateProduct(id: number, request: UpdateProductRequest): Promise<void> {
  await http.put(`/products/${id}`, request)
}
```

Không đọc response.data.id vì backend return NoContent() — HTTP 204 không có JSON body. id lấy từ route /products/:id/edit. Body gồm name/brandId/price/stock, không lấy ID từ input người dùng.

Ngay cả khi chỉ sửa stock, form vẫn gửi đầy đủ bốn trường. Endpoint hiện cập nhật cả bốn. Không gửi chỉ { stock: 12 } như PATCH: Name/BrandId/Price sẽ thiếu và validation thất bại. Stock bị thiếu có default0 ở DTO backend là hạn chế đã ghi trong roadmap; form luôn gửi đủ nhưng không thay thế việc hoàn thiện contract backend sau này.

## EF tracking được sử dụng ở đây

Controller lấy Product bằng query mặc định có tracking → gán thuộc tính từ request → SaveChangesAsync phát hiện thay đổi và UPDATE SQL. Nếu không có Product trả404. Backend kiểm tra hãng tồn tại trước khi gán BrandId. DTO đầu vào và entity là hai đối tượng với trách nhiệm khác nhau.

## Lỗi và giới hạn

- Zod sai: không gửi PUT.
- Backend 400: hiện lỗi field, giữ nội dung form.
- GET404: không mở form trống để tạo nhầm.
- Sản phẩm bị xóa giữa GET và PUT: PUT404, form báo sản phẩm không còn tồn tại.
- Mất kết nối/timeout: chưa khẳng định có lưu hay chưa, kiểm tra lại chi tiết trước khi gửi lại.

Hiện chưa có optimistic concurrency/rowversion: hai người cùng mở một TV rồi lưu có thể ghi đè thay đổi của nhau. Chưa có Identity/phân quyền; bài thực hành local, không coi form quản trị đã hoàn thiện cho public.

## Kiểm tra

Đặt breakpoint trong Update; xem id từ URL, request từ body, product từ SQL. Dừng sau SaveChangesAsync rồi Continue để thấy PUT204 và GET chi tiết trong Network.

Đã kiểm tra API thật trên sản phẩm thử riêng: stock10→12, đổi hãng, PUT204 và GET xác nhận; PUT sai stock trả400 và không đổi giá trị; ID không có trả404. Đã xóa riêng sản phẩm thử ID9, giữ sản phẩm người học. Build/lint và test schema/store tiếp tục chạy để kiểm tra hồi quy. Chưa kiểm thử giao diện trong browser.
