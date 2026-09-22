# Bài 11: Lọc theo hãng bằng khóa ngoại

## UI và luồng mới

Dropdown Hãng TV lấy dữ liệu thật từ GET /api/brands; không viết cứng danh sách Samsung/LG hoặc ID trong frontend. BrandFilter tải danh sách bằng Axios và có loading/error/retry riêng, không chặn danh sách TV khi tải hãng lỗi.

Mỗi option hiển thị brand.name nhưng value là brand.id. DOM select trả chuỗi, nên onChange chuyển Number(value). Option Tất cả hãng dùng chuỗi rỗng và chuyển thành undefined; không dùng Number('') vì sẽ thành 0, bị DTO backend từ chối.

Hãng đang chọn lưu trong Zustand vì ảnh hưởng query sản phẩm. Danh sách option và trạng thái tải nằm cục bộ trong BrandFilter vì hiện chỉ component đó dùng. Khi chọn hãng, filterByBrand lưu brandId và gọi loadProducts(1). Tìm tên vẫn giữ hãng, chuyển trang/retry giữ cả hai. Xóa tìm kiếm chỉ xóa tên; chọn Tất cả hãng chỉ xóa bộ lọc hãng.

## Request ví dụ

GET /api/products?page=1&pageSize=2&brandId=2&search=55

ID 2 là Samsung trong dữ liệu mẫu hiện tại, không phải quy định cố định của ứng dụng. Đọc ID từ response /api/brands.

ProductService có:

```csharp
if (request.BrandId.HasValue)
{
    query = query.Where(product => product.BrandId == request.BrandId.Value);
}

if (!string.IsNullOrEmpty(search))
{
    query = query.Where(product => product.Name.Contains(search));
}
```

Điều kiện kết hợp AND: TV thuộc hãng đã chọn VÀ tên chứa từ khóa. Hình dung SQL WHERE BrandId = @brandId AND Name LIKE ... . Count và phân trang thực hiện trên kết quả đã lọc.

Tìm Sa chỉ so khớp đoạn tên. Chọn Samsung dùng BrandId chính xác, kể cả tên TV không có chữ Samsung (ví dụ chỉ đặt tên Crystal UHD 55). BrandId là FK xác định quan hệ; tên hãng là nhãn hiển thị.

## Tự quan sát

- Network có request /api/brands để lấy options, và /api/products để lấy TV.
- Xóa từ khóa, chọn LG: một TV LG, query có brandId của LG.
- Chọn Samsung, tìm 55: hai Samsung mẫu.
- Giữ Samsung, tìm LG: không có kết quả vì AND, không phải OR.
- Chọn Tất cả hãng khi search vẫn LG: TV LG hiện lại.
- Đang trang 2 rồi đổi hãng: quay về trang 1.

Chọn hãng áp dụng ngay, còn ô tìm tên phải submit. Nếu vừa gõ tên mà chưa submit, đổi hãng dùng từ khóa đã áp dụng trong store chứ không lấy bản nháp.

Build/lint và 7 test store đạt. Kiểm tra API thật: danh sách hãng tải được, Samsung + 55 có 2 kết quả, Samsung + LG có 0. Không thay backend/DB; chưa kiểm tra UI tự động trên trình duyệt.
