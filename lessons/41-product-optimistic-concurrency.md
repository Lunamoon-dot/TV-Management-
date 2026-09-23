# Bài 41 — Optimistic concurrency với SQL Server rowversion

Giả sử hai Admin cùng mở TV có giá 10 triệu và tồn kho 5:

```text
Admin A GET: price=10m, stock=5, version=V1
Admin B GET: price=10m, stock=5, version=V1

Admin A PUT: price=11m + V1 → thành công, database sinh V2
Admin B PUT: stock=8 + V1  → nếu không kiểm tra sẽ ghi đè price về 10m
```

Đây là **lost update**. Request của Admin B dựa trên dữ liệu đã cũ nhưng backend không biết điều đó nếu chỉ dùng `Id`.

## Rowversion là gì?

SQL Server `rowversion` là một dãy byte tự đổi mỗi khi row được cập nhật. Nó không phải ngày giờ và không biểu diễn thời gian thực.

```csharp
public byte[] RowVersion { get; set; } = [];

modelBuilder.Entity<Product>()
    .Property(product => product.RowVersion)
    .IsRowVersion();
```

Migration thêm cột `rowversion NOT NULL`; SQL Server tự cấp token cho sản phẩm hiện có và tự sinh token mới sau mỗi update.

JSON serialize `byte[]` thành chuỗi Base64. Vì vậy TypeScript nhận `rowVersion: string`, ví dụ `AAAAAAAAB9E=`.

## Luồng GET → sửa → PUT

`ProductResponse` trả rowVersion. Khi mở trang sửa, React giữ token này cùng snapshot sản phẩm. Token không nằm trong input vì người dùng không cần chỉnh nó.

Khi submit:

```ts
updateProduct(id, { ...request, rowVersion: product.rowVersion })
```

Backend decode Base64 rồi đặt nó làm original value:

```csharp
_context.Entry(product)
    .Property(item => item.RowVersion)
    .OriginalValue = rowVersion;
```

EF Core sinh SQL có dạng:

```sql
UPDATE Products
SET Name = ..., Price = ..., Stock = ...
WHERE Id = @id AND RowVersion = @oldVersion;
```

- Token còn mới: một row được update, SQL Server sinh token mới.
- Token đã cũ: không row nào khớp, EF ném `DbUpdateConcurrencyException`.

Controller bắt exception và trả `409 Conflict`. React giải thích rằng TV đã thay đổi ở nơi khác và yêu cầu Admin tải lại trước khi sửa tiếp. Backend không tự retry bằng dữ liệu cũ vì điều đó vẫn có thể ghi đè thay đổi của người khác.

## Optimistic nghĩa là gì?

Ta giả định xung đột không xảy ra thường xuyên nên không khóa row trong toàn bộ thời gian Admin mở form. Chỉ lúc ghi mới kiểm tra version.

```text
Optimistic concurrency: không giữ lock khi người dùng suy nghĩ; phát hiện conflict lúc SaveChanges
Pessimistic locking: giữ/đòi lock để ngăn người khác thay đổi trước
```

Form web có thể mở nhiều phút nên optimistic concurrency thường phù hợp hơn. Transaction `Serializable` vẫn được dùng ở checkout/hủy đơn cho đoạn nghiệp vụ ngắn có cập nhật tồn kho; hai cơ chế giải quyết tình huống khác nhau.

## Tồn kho cũng làm token đổi

Checkout và hủy đơn cập nhật `Product.Stock`, nên rowVersion cũng đổi. Nếu Admin mở form trước khi một Customer đặt hàng, PUT của Admin sẽ nhận `409`. Điều này ngăn form cũ ghi Stock 5 đè lên Stock 4 mới nhất.

## Những gì đã kiểm tra

- Backend build không warning/error.
- Frontend 48 test, lint và production build đạt.
- GET/POST trả rowVersion Base64.
- PUT đầu tiên với token hiện tại trả `204` và token đổi.
- PUT thứ hai dùng token cũ trả `409`.
- Dữ liệu từ PUT đầu tiên vẫn được bảo toàn.
- Filter, pagination, checkout, ownership, cancel và hoàn kho vẫn đạt.
- Migration `20260923122459_AddProductRowVersion` đã áp dụng SQL Server local.

Bài này bảo vệ thao tác update Product. Nếu sau này thêm nhiều thao tác ghi đồng thời lên Order ngoài workflow hiện tại, có thể áp dụng concurrency token tương tự dựa trên rủi ro thực tế.
