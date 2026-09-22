> Cập nhật: form hiện dùng Zod. Các mô tả HTML validation/ép Number thủ công phía dưới ghi lại phiên bản đầu; luồng hiện tại được mô tả ở mục Zod ngay bên dưới.

## Validation hiện tại bằng Zod

Schema nằm trong frontend/src/features/products/schemas/create-product.ts. Input là chuỗi; schema trim, kiểm tra bắt buộc, chuyển số và kiểm tra giới hạn. CreateProductForm dùng z.input, CreateProductRequest dùng z.output, nên kiểu JSON được suy ra từ schema thay vì khai báo lặp lại.

Trong handleSubmit: createProductSchema.safeParse(form). Nếu thất bại, z.flattenError(error).fieldErrors được đặt vào errors rồi return trước khi gọi Axios. Nếu thành công, createProduct(parsed.data) gửi dữ liệu đã chuẩn hóa.

Form dùng noValidate để lỗi hiển thị thống nhất bằng Zod, không bị popup validation HTML chặn trước handleSubmit. Các thuộc tính required/min/step vẫn mô tả input; không dựa vào chúng làm bộ kiểm tra chính. Ô số trống bị chặn trước transform(Number), nên stock rỗng không biến thành 0; stock '0' vẫn hợp lệ. Giá phải dương từ 0.01 và tối đa hai chữ số thập phân theo form hiện tại.

Thực hành mới: tên chỉ gồm khoảng trắng hoặc giá âm bị Zod chặn, Network không có POST. Để quan sát lỗi server, dùng request .http sai hoặc trường hợp brandId không còn tồn tại; không cần tắt Zod trong source. Backend vẫn giữ DataAnnotations và kiểm tra hãng tồn tại, vì request không bắt buộc đi qua React. Ánh xạ ValidationProblemDetails về form vẫn hoạt động.

Zod không biến JavaScript number thành decimal chính xác ở mọi độ lớn; giới hạn precision tiền tệ của transport vẫn cần giải quyết theo roadmap. Không thay đổi DTO/backend trong lần cập nhật này.

Tài liệu: https://zod.dev/basics

# Bài 13: Form React → POST DTO → SQL → trang chi tiết

## Thực hành

Chạy API profile http và frontend npm run dev. Danh sách có liên kết Thêm TV tới /products/new. Chọn hãng, nhập tên, giá và tồn kho rồi Tạo TV. Thành công chuyển tới /products/{id} và trang chi tiết gọi GET để đọc lại dữ liệu từ DB.

Đây là chức năng ghi dữ liệu thật vào DB local. Quyền quản trị chưa triển khai; khi học Identity phải bảo vệ POST ở backend, không chỉ ẩn link. Chưa public API ghi hiện tại.

## Dữ liệu form và JSON

CreateProductPage giữ input dạng chuỗi trong useState để ô số có thể rỗng lúc người dùng đang sửa. Trước POST, tạo object:

```ts
{
  name: form.name.trim(),
  brandId: Number(form.brandId),
  price: Number(form.price),
  stock: Number(form.stock),
}
```

required của HTML chặn ô rỗng khi submit thông thường, nên không âm thầm đổi stock rỗng thành 0. Number('') thực ra bằng 0, vì vậy không được dựa vào ép kiểu thay validation. Backend vẫn cần validation độc lập vì client có thể bị bỏ qua. TypeScript CreateProductRequest chỉ mô tả kiểu khi viết code; không tự validate runtime.

Axios http.post('/products', request) gửi JSON body tới /api/products. Không bọc { data: request }; DTO backend hiện nhận trực tiếp name/brandId/price/stock. response.data là JSON nhận về từ Axios, không phải yêu cầu body phải có khóa data.

## Các bước backend

1. Routing chọn action HttpPost.
2. Model binding đọc JSON thành CreateProductRequest.
3. [ApiController] kiểm tra DataAnnotations; dữ liệu sai trả 400 trước action.
4. Action kiểm tra brandId có thật trong bảng Brands. ID dương chưa đủ: hãng phải tồn tại. Nếu không có, ValidationProblem trả 400.
5. Tạo Product, Add và SaveChangesAsync.
6. SQL cấp ID; CreatedAtAction trả 201, Location và ProductResponse.
7. React dùng response.id chuyển trang. Không tự đoán ID tiếp theo. Dùng replace để Back không quay lại form vừa submit.

## Đưa validation về form

Body 400 thường có errors với tên thuộc tính C#:

```json
{ "errors": { "Name": ["The Name field is required."], "BrandId": ["The selected brand does not exist."] } }
```

readProductValidation chỉ nhận các field đã biết và mảng thông báo dạng string, ánh xạ Name → name, BrandId → brandId; hỗ trợ $.price cho lỗi chuyển JSON. Form giữ dữ liệu đã nhập, hiển thị thông báo dưới ô liên quan và thông báo chung. Không đưa raw exception hoặc HTML vào UI.

Nhập tên chỉ gồm dấu cách rồi submit: HTML required có thể cho qua, nhưng trim gửi chuỗi rỗng và backend Required từ chối. Đây là cách quan sát 400 từ server mà không cần bỏ validation trên browser. Nhập giá âm thông thường bị HTML min chặn trước khi request gửi; dùng Network để phân biệt hai trường hợp.

## State và lỗi khi ghi

Form chỉ một màn hình nên dùng local state. Zustand vẫn quản lý danh sách/bộ lọc; khi quay lại danh sách, effect tải lại API, không phải đẩy thủ công bản ghi mới vào mọi trang đã lọc.

submitting khóa fieldset và inFlight ref chặn submit lặp trong cùng component. Đây chưa phải idempotency ở server: mở nhiều tab hoặc gửi lại request vẫn có thể tạo trùng. Với timeout/lỗi mạng, không biết chắc server đã lưu hay chưa; UI yêu cầu kiểm tra danh sách trước khi gửi lại, không tự retry POST.

Danh sách hãng tải từ API có loading/error/retry. Không có hãng thì chưa cho tạo. Stock/brandId là int, price là decimal ở backend nhưng number ở JS; xử lý precision/ràng buộc tiền tệ toàn diện còn trong roadmap, không coi number là giải pháp số tiền chính xác cho mọi giá trị decimal.

## Đặt breakpoint

- Đầu action Create: xem request nhận từ JSON.
- Sau khi load brand: xem BrandId và navigation Brand.
- Sau SaveChangesAsync: xem product.Id được cấp.
- DevTools Network: POST payload → status201 → response.id → GET /api/products/{id}.

## Kiểm chứng

Build/lint và 9 test đạt (gồm ánh xạ errors). Kiểm tra API thật: payload sai 400, POST đúng 201, GET đọc lại tên/tồn kho đúng. Đã xóa riêng sản phẩm thử ID7 sau khi kiểm tra, không xóa sản phẩm của người học. SQL identity có thể có khoảng trống sau khi xóa — điều này bình thường, không reset ID để lấp khoảng trống. Chưa kiểm tra UI tự động trong browser.

