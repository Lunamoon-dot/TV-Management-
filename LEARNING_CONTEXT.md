# Bối cảnh học tập

## Nền tảng hiện tại

- Tôi đã có kinh nghiệm với React, Node.js, Express và MongoDB.
- Tôi đang học C# và muốn hiểu kiến trúc ứng dụng sử dụng ASP.NET Core Web API.
- Tôi muốn cùng trợ lý thử nghiệm từng phần trong project để hiểu cách hệ thống hoạt động.

## Mục tiêu

Hiểu cách xây dựng và kết nối ứng dụng gồm:

**React (frontend) → ASP.NET Core Web API (backend) → SQL Server (database).**

Tập trung hiểu vai trò của từng thành phần, luồng request/response và cách backend truy cập dữ liệu, thay vì chỉ sao chép code chạy được.

## Yêu cầu sản phẩm và định hướng mới — 12/09/2026

Người học muốn sản phẩm cuối là web bán TV hoàn chỉnh, chất lượng chuyên nghiệp và được deploy, không dừng ở demo CRUD. Đã có nền tảng React/Express/MongoDB nên muốn chuyển dần sang thực hành tính năng thực tế ngay, học kiến thức C#/.NET còn thiếu theo từng tính năng. Hiện đã tương đối hiểu DTO, binding, validation, CancellationToken, routing, CRUD đã làm và tracking.

Các yêu cầu do người học nêu:

1. Bảo mật: ưu tiên ASP.NET Core Identity + cookie cho ứng dụng web.
2. Tổ chức route, folder và code rõ trách nhiệm, dễ bảo trì, theo cách làm chuyên nghiệp.
3. Học nền tảng làm việc với database cloud, không chỉ đổi connection string.
4. Kết nối React với backend hiện tại và hiểu các vấn đề liên quan.
5. Đi đến sản phẩm đầy đủ, kiểm thử và triển khai thực tế.

Lộ trình và tiêu chí cụ thể nằm trong `PROJECT_ROADMAP.md`. Đây là kế hoạch phát triển từng bước; không đồng nghĩa các tính năng đã được triển khai. Nhà cung cấp cloud, ngân sách và phạm vi thanh toán thật chưa được quyết định.

Ngày 12/09/2026, người học cung cấp `C:\Users\dell\E_disk\Captures\Pictures\drawio\btl.drawio` làm cơ sở mô hình nghiệp vụ, cho phép chỉnh sửa/bổ sung để có cả quản lý và khách hàng. Đã đọc sơ đồ: có TV và các danh mục, nhân viên/ca làm/công việc, khách hàng, nhà cung cấp, hóa đơn nhập/bán và chi tiết. Thiết kế đích được ghi trong `DATA_MODEL.md`, phân biệt dữ liệu gốc với phần đề xuất. Giữ phần quản lý, bổ sung Identity, hồ sơ khách liên kết tài khoản, địa chỉ, giỏ hàng, đơn đặt hàng/chi tiết, thanh toán, vận chuyển. Đơn đặt hàng tách khỏi hóa đơn bán; sửa khóa dòng hóa đơn và bổ sung snapshot đơn giá. Chưa đổi schema/code theo thiết kế mới. Khi học quan hệ SQL, bắt đầu Brand–Product rồi mở rộng từng bước.

## Chủ đề thực hành đã thống nhất

- Dùng **website bán TV** làm ví dụ xuyên suốt khi học React + ASP.NET Core Web API + SQL Server.
- `Product` đại diện cho sản phẩm TV, hiện có các trường `Id`, `Name`, `Brand`, `Price`, `Stock`.
- Giữ tên model `Product` và API `/api/products`; bổ sung thuộc tính hoặc tính năng khi đến bài học cần chúng.
- Đã bỏ controller, model và request mẫu WeatherForecast mặc định.
- Bắt đầu từ danh sách TV, sau đó từng bước học tạo sản phẩm và hiển thị dữ liệu trên React. Các chức năng khác sẽ thống nhất sau, chưa tự động triển khai toàn bộ website.

## Cách đồng hành đề xuất

- Người học thấy DI/lifetime còn mơ hồ nếu chỉ giải thích lý thuyết. Ưu tiên thay đổi nhỏ trong project và hướng dẫn breakpoint/quan sát request thật để giải thích khái niệm; dùng approach này cho các bài tiếp theo.
- Người học đã làm CRUD nhiều lần với Express: nói ngắn phần route/handler quen thuộc, tập trung phần đặc thù .NET và SQL (DI, EF, navigation, FK, migration, transaction, auth). Không đánh đồng giải thích ngắn với triển khai nhiều bước không theo dõi được.
- Yêu cầu rõ ngày 13/09/2026: với case phức tạp, tiếp tục chia thành từng bài nhỏ như hiện tại để người học theo sát quá trình build. Mỗi bài giải thích luồng/code và kiểm tra kết quả; để người học có cơ hội hỏi trước khi chuyển sang phần tiếp theo, không tự triển khai nhiều module liên tiếp.
- Giải thích bằng tiếng Việt, liên hệ với React, Express và MongoDB khi hữu ích.
- Phân biệt rõ khái niệm C#, .NET, ASP.NET Core và Entity Framework Core khi gặp chúng.
- Thực hành từng bước nhỏ; giải thích mục đích của thay đổi và cách kiểm tra kết quả.
- Đọc cấu trúc hiện có trước khi sửa, giữ thay đổi tập trung vào nội dung đang học.
- Chưa áp dụng kiến trúc nhiều tầng hoặc abstraction phức tạp nếu chưa làm rõ nhu cầu.
- Đây là định hướng đồng hành đề xuất, có thể điều chỉnh theo yêu cầu tiếp theo của tôi.

## Tiến độ checkout — bài 29

Checkout đã nhận tên người nhận, số điện thoại và địa chỉ giao hàng. React dùng Zod để báo lỗi theo field; ASP.NET bind vào `CreateOrderRequest` và validate lại; SQL lưu ba giá trị trực tiếp trên `Order` như snapshot. Trang chi tiết đơn đọc lại thông tin này sau refresh. Chưa tách sổ địa chỉ riêng vì hiện chưa có nhu cầu lưu nhiều địa chỉ cho một khách hàng.

## Tiến độ checkout — bài 30

Checkout có `CheckoutId` UUID và unique index theo `(CustomerId, CheckoutId)`. Gửi lại cùng request trả đơn đã tạo thay vì tạo đơn và trừ kho lần nữa. React giữ UUID ổn định bằng `useRef` trong vòng đời trang giỏ hàng. Chưa persist lần checkout đang chờ qua thao tác đóng tab/browser.

## Tiến độ Customer Orders — bài 31

Customer có thể tự hủy đơn `Pending` từ trang chi tiết. Backend lấy CustomerId từ cookie, trả 404 cho đơn người khác, hoàn kho và đổi trạng thái trong cùng transaction. `OrderCancellationService` được tạo vì Admin và Customer thật sự dùng chung nghiệp vụ hoàn kho; controller tiếp tục chịu trách nhiệm auth và HTTP response.

## Tiến độ Catalog — bài 32

Product có thêm ImageUrl, ScreenSizeInches và Resolution xuyên suốt SQL, EF, DTO, Admin form và Customer UI. Cột entity nullable để không bịa dữ liệu cho TV legacy; create/update request bắt buộc và được kiểm tra ở Zod lẫn backend. Hiện ảnh là URL ngoài, chưa có upload hoặc object storage.

## Tiến độ Payment — bài 33

Order đã tách PaymentMethod và PaymentStatus khỏi OrderStatus. Customer chọn COD hoặc chuyển khoản; đơn mới luôn Unpaid và client không được gửi trạng thái thanh toán. EF lưu enum dạng chuỗi. Migration backfill đơn cũ bằng CashOnDelivery/Unpaid sau khi review và sửa default chuỗi rỗng do EF sinh tự động.

## Tiến độ Payment — bài 34

Admin có thể xác nhận Unpaid thành Paid qua endpoint role Admin + CSRF; gọi lặp lại an toàn. Customer chỉ đọc kết quả và không gọi được endpoint. Đơn Paid bị chặn hủy cho đến khi có nghiệp vụ refund. Đây vẫn là đối soát thủ công, chưa phải tích hợp cổng thanh toán hoặc webhook.

## Tiến độ Payment — bài 35

Xác nhận Paid lưu thêm PaidAt và email Admin dạng snapshot. Retry không ghi đè audit ban đầu. Customer thấy thời điểm, còn email người xác nhận chỉ trả trong Admin API. Đây là audit tối thiểu trên Order, chưa phải bảng audit event tổng quát.

## Tiến độ Admin Orders — bài 36

Admin có `GET /api/admin/orders/{id}` projection sang DTO chi tiết gồm Customer email, snapshot giao hàng, payment audit và items. React có `/admin/orders/:id`, link từ bảng cùng loading/error/404. Customer bị chặn 403; Admin đọc đúng giao hàng/item. Không đổi schema hoặc migration. Xem `lessons/36-admin-order-details.md`.

## Tiến độ Order Status — bài 37

Thêm `OrderStatusHistory` lưu previous/new status, thời gian và email actor lấy từ Identity. Tạo đơn, Admin transition, Admin/Customer cancel đều ghi history cùng transaction; thao tác lỗi không ghi. Migration `20260923073347_AddOrderStatusHistory` đã apply và backfill một mốc cho đơn cũ. Admin detail hiển thị timeline và dùng `AsSplitQuery` cho Items + StatusHistory. Xem `lessons/37-order-status-history.md`.

## Tiến độ Order Status — bài 38

Customer và Admin phải nhập lý do 5–300 ký tự khi hủy. React dùng chung Zod schema; backend DTO + kiểm tra sau Trim bảo vệ lại. Reason được lưu nullable trên đúng `OrderStatusHistory` Cancelled và hiển thị trong timeline Admin. Migration `20260923090846_AddOrderCancellationReason` đã apply. Integration test xác nhận invalid 400, actor/reason đúng, hủy lặp và Paid vẫn bị chặn. Xem `lessons/38-order-cancellation-reason.md`.

## Tiến độ Admin Orders — bài 39

Thêm `OrderNote` cho ghi chú vận hành nội bộ, tách khỏi status history. Admin POST note với CSRF, nội dung 3–1000 ký tự, actor lấy từ Identity; chi tiết Admin hiển thị mới nhất trước và thêm note vào state sau 201. Customer gọi endpoint nhận 403 và OrderResponse không có notes. Migration `20260923091536_AddOrderNotes` đã apply. Xem `lessons/39-admin-order-notes.md`.

## Tiến độ Admin Orders — bài 40

Danh sách Admin lọc được theo một phần email Customer, OrderStatus và PaymentStatus; các điều kiện kết hợp AND trước Count/OrderBy/Skip/Take/Select. React tách draft email khỏi filters đã áp dụng, select áp dụng ngay và đổi filter reset page 1. Enum query sai trả 400; không khớp trả 200 rỗng. Không đổi schema/migration. Xem `lessons/40-admin-order-filters.md`.

## Tiến độ Product Concurrency — bài 41

Product có SQL Server rowversion; response serialize byte[] thành Base64 và form edit gửi token GET cũ trong PUT. EF dùng token làm original value, stale update ném DbUpdateConcurrencyException và API trả 409; React yêu cầu reload thay vì ghi đè. Stock đổi do checkout/cancel cũng đổi token. Migration `20260923122459_AddProductRowVersion` đã apply. Test hai update cùng token xác nhận update đầu giữ nguyên, update sau 409; catalog/order regression đạt. Xem `lessons/41-product-optimistic-concurrency.md`.

## Bối cảnh project đã kiểm tra

- Solution: `nothing.slnx`.
- Backend: `nothing/`, sử dụng ASP.NET Core Web API, target `net10.0`.
- `Program.cs` đăng ký controllers và `AppDbContext` thông qua dependency injection, dùng EF Core với SQL Server.
- `Data/AppDbContext.cs` khai báo `DbSet<Product> Products`.
- Có model `Product` và migration `InitialCreate`; sự tồn tại của migration chưa chứng minh đã áp dụng vào database.
- Cấu hình database trong `appsettings.json`: SQL Server local instance `.\MSSQLSERVER01`, database `NothingDb`, xác thực Windows.
- Đã xác minh kết nối database thực tế bằng `GET /api/products`: trả `200 OK` và `[]` ngày 09/09/2026; bảng `Products` chưa có dữ liệu tại thời điểm kiểm tra.
- Endpoint `GET /api/products` đọc danh sách TV từ bảng `Products` trong SQL Server.
- Profile HTTP dùng `http://localhost:5005`; profile HTTPS dùng `https://localhost:7106` và HTTP cổng `5005`.

## Những điểm đã trao đổi

- `dotnet build` biên dịch project, chưa khởi động server API.
- `dotnet run --project nothing/nothing.csproj --launch-profile http` chạy API từ thư mục solution.
- Chỉ gửi request sau khi API đã chạy và hiển thị `Now listening on`.
- Trong Visual Studio có thể dùng **Debug → Start Without Debugging** nếu phím tắt không thuận tiện.
- Hai phiên API cùng sử dụng cổng `5005` sẽ gây lỗi `address already in use`; cần dừng phiên cũ trước khi chạy phiên mới.
- Đường dẫn `/` chưa có endpoint; dùng `/api/products` để thử API hiện tại.

## Hướng thực hành tiếp theo có thể chọn

Đã thêm `Controllers/ProductsController.cs` với `GET /api/products` và request mẫu trong `nothing.http`. Controller nhận `AppDbContext` qua constructor, đọc sản phẩm bằng `AsNoTracking`, sắp xếp theo `Id`, thực thi bằng `ToListAsync` rồi trả JSON qua `Ok`. Build thành công, endpoint đã được kiểm tra với database thật. Phiên kiểm tra riêng dùng cổng `5006` đã được dừng để tránh chiếm cổng của người học.

Đã thêm `POST /api/products` với DTO `DTOs/CreateProductRequest.cs`: bắt buộc tên và hãng, giá từ 0.01 đến giới hạn của `decimal(18,2)`, tồn kho không âm. `[ApiController]` tự trả 400 khi validation thất bại. Controller chuyển DTO thành `Product`, gọi `Add` và `SaveChangesAsync`, trả 201 với sản phẩm có ID do database tạo. POST hiện dùng `CreatedAtAction` để trả thêm header `Location` dẫn tới action lấy chi tiết sản phẩm.

Đã kiểm tra build thành công; request sai tên/giá/tồn kho trả 400 và không thêm bản ghi; request hợp lệ trả 201 và GET đọc lại đúng dữ liệu. Đã giữ một TV mẫu Samsung 4K 55 inch, giá 12990000, tồn kho 10 trong database để thực hành. Phiên kiểm tra cổng 5006 đã dừng. `nothing.http` có request GET, POST hợp lệ và POST không hợp lệ.

EF Core hiện cảnh báo model chưa khai báo precision cho Price; migration hiện dùng decimal(18,2). Cần giải thích và xử lý precision/làm tròn khi học sâu hơn về giá tiền trước khi dùng thực tế.

Đã trao đổi về việc framework chọn action bằng URL + HTTP method, sau đó đọc kiểu tham số để chuyển JSON thành DTO và validate trước khi gọi action. DTO không phải middleware; client không gửi tên DTO. `CancellationToken` do ASP.NET cung cấp để truyền tín hiệu hủy request vào thao tác bất đồng bộ; hủy request không bảo đảm dữ liệu chưa được lưu.

Ngày 12/09/2026: đã thêm `GET /api/products/{id:int}` vào `GetById(int id, CancellationToken cancellationToken)`. ASP.NET lấy `id` từ URL. EF Core dùng `AsNoTracking` và `FirstOrDefaultAsync` để tìm TV; có dữ liệu trả 200, không có trả 404. Route yêu cầu số nguyên nên `/api/products/abc` không khớp và trả 404. POST dùng `CreatedAtAction(nameof(GetById), new { id = product.Id }, product)`.

Build thành công; đã kiểm tra GET có/không có ID, route không phải số nguyên và POST 201 với Location truy cập được đúng sản phẩm. Đã thêm TV mẫu LG 4K 55 inch (ID 3, giá 11990000, tồn kho 5) trong database khi kiểm tra. Phiên chạy thử cổng 5006 đã dừng. File `nothing.http` có request lấy chi tiết và thử 404.

Đã trao đổi về DTO đầu vào/đầu ra: GET không bắt buộc dùng DTO; hiện vẫn trả entity trực tiếp. Người học đã hiểu tracking là EF Core theo dõi entity trong DbContext để lưu thay đổi. `AsNoTracking` không làm đối tượng thành chỉ đọc: sửa đối tượng rồi trả về client vẫn thấy giá trị mới, nhưng sửa đó không được `SaveChangesAsync` tự lưu vào database.

Đã thêm `PUT /api/products/{id:int}` với `UpdateProductRequest` (Name, Brand, Price, Stock; validation tương tự tạo sản phẩm). Action `Update` nhận ID từ URL và DTO từ body, truy vấn có tracking, trả 404 nếu không có TV; nếu có thì gán các thuộc tính, gọi `SaveChangesAsync` và trả 204 không có body. Đây là cập nhật toàn bộ các trường được phép sửa, chưa triển khai PATCH. Khi thử nên gửi đầy đủ bốn trường; Stock là int nên nếu bỏ qua sẽ mặc định 0.

Build PUT thành công. Kiểm tra với SQL Server thật: 204 và GET xác nhận đủ bốn trường được lưu, tên/hãng được Trim; PUT lặp lại thành công; dữ liệu sai trả 400 và không thay đổi DB; ID không tồn tại trả 404 và không tạo bản ghi. Đã khôi phục sản phẩm ID 1 về dữ liệu trước kiểm tra và dừng phiên cổng 5006. `nothing.http` có các request PUT tương ứng.

Ngày 13/09/2026: thêm `DELETE /api/products/{id:int}`. Action truy vấn Product, trả 404 nếu không có; `Remove` đánh dấu Deleted, `SaveChangesAsync` thực thi xóa và trả 204. Đây là xóa thật ở schema đơn giản chưa có đơn hàng; khi có quan hệ lịch sử sẽ bổ sung quy tắc chặn xóa/ngừng bán. Build đạt 0 lỗi/0 cảnh báo; đã tạo riêng TV thử ID 4, kiểm tra GET 200 → DELETE 204 → GET 404 → DELETE lần hai 404. Các TV có trước kiểm tra giữ nguyên; TV thử đã xóa, phiên kiểm tra 5006 đã dừng. `nothing.http` có luồng tạo/xóa mẫu, dùng deleteProductId riêng mặc định -1 để người học chủ động chọn ID thử.

Bài hiện tại đã triển khai Brand–Product sau bài thiết kế `lessons/01-brand-product.md`. Xem `lessons/02-brand-migration.md` để đọc entity → cấu hình EF → migration/backfill → API. Product.Brand là navigation, BrandId là FK bắt buộc; Brand.Name dài tối đa 100, có unique index; FK chặn xóa hãng có TV. Migration `20260912184708_AddProductBrands` đã áp dụng vào NothingDb, giữ nguyên ba sản phẩm cũ; LG Id 1, Samsung Id 2. GET /api/brands trả hãng hiện có; POST/PUT nhận brandId; ProductResponse giữ tên brand và thêm brandId. Include tải hãng cho GET. Chưa có API ghi hãng.

Đã thử Up/Down/Up trên database tạm và kiểm tra bảo toàn dữ liệu, unique, FK/hạn chế xóa. HTTP kiểm tra đọc/tạo/sửa theo hãng, ID hãng sai trả 400, TV không có trả 404. TV test đã xóa, dữ liệu sản phẩm cũ không đổi, database tạm đã dọn và phiên 5006 đã dừng. Chưa triển khai frontend hay Identity; API ghi dữ liệu chỉ dùng học local. Tiếp tục giải thích bài migration này theo câu hỏi của người học trước khi triển khai module khác.

## Ghi chú cho các lần làm việc sau

Ngày 16/09/2026: đã chuyển riêng GET danh sách TV sang Services/ProductService.GetProductsAsync, đăng ký AddScoped<ProductService> trong Program.cs và inject service vào ProductsController. Controller còn nhận AppDbContext cho các action chưa chuyển. Service nhận cùng context scoped trong request; trả DTO, controller trả Ok. Không thay contract/schema/query; hai bộ test filter/pagination đạt trước và sau, GET chi tiết vẫn 200, phiên kiểm tra đã dừng. Bài lessons/05-product-service-di.md hướng dẫn breakpoint constructor/action/service, so ContextId giữa controller và service, request mới có context mới, và resolve cùng scope trả cùng service. Chờ người học quan sát/hiểu trước khi mở rộng chuyển các action khác.

Trạng thái mới nhất: đã thêm phân trang GET /api/products, bài lessons/04-product-pagination.md. ProductQueryRequest có Page mặc định 1 (1–1000000), PageSize mặc định 20 (1–100). CountAsync sau các bộ lọc, trước OrderBy/Skip/Take/Select/ToListAsync; hai query await lần lượt. Response đổi từ mảng sang ProductPageResponse { items, totalCount, page, pageSize }. Trang vượt dữ liệu trả 200 với items rỗng. Chưa có snapshot transaction để đảm bảo count/items cùng thời điểm khi dữ liệu thay đổi đồng thời. Test pagination fail trước triển khai, pass sau; test filter đã cập nhật theo response mới và pass. GET chi tiết vẫn 200 đúng cấu trúc cũ; dữ liệu không đổi, phiên kiểm tra đã dừng. Các ghi chú phía dưới về chưa phân trang là lịch sử bài trước.

Đã triển khai bước lọc/tìm kiếm ở lessons/03-product-filters.md: GET /api/products nhận [FromQuery] ProductQueryRequest (BrandId nullable, Range > 0; Search nullable, StringLength 200). Xây IQueryable với Where có điều kiện, Trim từ khóa, Contains tên, kết hợp AND trước OrderBy/Select/ToListAsync. Không có kết quả trả 200 []; input sai trả 400. Response vẫn là mảng, chưa phân trang. Test đọc SQL thật tại tests/product-filters.ps1 đã chứng kiến fail trước triển khai và pass sau; cần dữ liệu mẫu có TV thuộc ít nhất hai hãng. Phiên kiểm tra 5006 đã dừng. Chờ người học hiểu bước này rồi thêm phân trang/tổng số kết quả.

Đã đổi GET danh sách/chi tiết Product từ Include + mapping sau truy vấn sang Select trực tiếp new ProductResponse trước ToListAsync/FirstOrDefaultAsync. Projection chỉ chứa scalar nên không cần AsNoTracking; POST vẫn dùng FromProduct vì entity đã có hãng. Build đạt; GET ba TV và chi tiết đúng cấu trúc JSON/tên hãng, ID không có trả 404. Log SQL xác nhận JOIN và chỉ chọn các cột DTO. Phiên kiểm tra 5006 đã dừng. Bài tiếp theo giới thiệu query string/[FromQuery], lọc theo hãng/tên và phân trang; chưa triển khai các tham số đó vào endpoint.

Đọc file này để nắm bối cảnh học tập. Kiểm tra lại code và trạng thái chạy thực tế vì thông tin project có thể thay đổi. Cập nhật file khi có tiến triển hoặc định hướng mới được thống nhất.

Ngày 16/09/2026: bài 6 tại lessons/06-error-handling.md thêm ExceptionHandlers/GlobalExceptionHandler (IExceptionHandler), AddExceptionHandler/AddProblemDetails và UseExceptionHandler. Exception chưa xử lý trả 500 application/problem+json với thông báo chung và traceId; ILogger ghi exception chi tiết ở server. Validation 400 và 404 chủ động không đi qua handler. Build đạt; tests/error-handling.ps1 đạt trên phiên riêng dùng SQL endpoint không truy cập được; filter/pagination đạt với cấu hình DB bình thường. Các phiên thử đã dừng, không đổi schema/dữ liệu/cấu hình SQL lưu trên đĩa. Người học yêu cầu giải thích kỹ vì chưa vững phần này ở Express; quan sát luồng await/exception và breakpoint trước khi chuyển bài tiếp.

Ngày 17/09/2026: người học tương đối hiểu exception handling và muốn sang bài tiếp. Đã thêm lessons/07-configuration-environments.md: IConfiguration, thứ tự nguồn cấu hình, ConnectionStrings__DefaultConnection, runtime environment khác Debug/Release, launch profile local và bài tập Development/Production quan sát OpenAPI. Bài này chỉ thêm tài liệu dựa trên code hiện có, chưa chạy bài tập môi trường; không đổi backend/schema/connection string. Tiếp theo hướng đến React gọi API, sau khi người học nắm cấu hình. Các phần validation/precision còn thiếu vẫn cần hoàn thiện theo roadmap.

Ngày 17/09/2026: bài 8 React gọi API đã thêm frontend (Vite React TypeScript), GET trang đầu 20 TV qua /api dev proxy mặc định 5005, trạng thái loading/error/empty/success, nút tải lại, AbortController. Không sửa backend hoặc DB. Build/lint đạt; HTTP qua proxy thử 5006 đọc đúng 3 TV. Hướng dẫn tại lessons/08-react-api.md, cần người học quan sát Network và breakpoint trước khi thêm form/đăng nhập. Chưa kiểm chứng render bằng browser.

Ngày 17/09/2026: theo yêu cầu người học, frontend chuyển sang tổ chức theo feature, Zustand quản lý load state/catalog, Axios instance dùng chung /api, Tailwind qua Vite plugin. ProductsPage → store → API → backend. Giữ GET trang đầu và trạng thái UI, chưa thêm auth/router/form. Bài 8 đã viết lại theo cấu trúc mới.

Ngày 22/09/2026: bài 18 role authorization: `Admin` role được tạo local trong Development; `DevelopmentAdminSeeder` chỉ gán role khi có `BootstrapAdmin:Email` trong User Secrets và chỉ cần password khi tạo account mới. POST/PUT/DELETE product có `[Authorize(Roles = AppRoles.Admin)]` + CSRF; GET vẫn public. React đọc `roles` từ `/api/auth/me`, ẩn link quản trị, chặn route UI và gửi CSRF header cho mutation. Backend build sang `.codex-check/role-authorization` đạt, frontend lint/build đạt; SQL local đã kiểm tra anonymous=401, Admin thiếu CSRF=400, Admin hợp lệ đi tới action=404 trên ID không tồn tại. Tài khoản test đã xoá; role Admin giữ lại. Xem lessons/18-role-authorization.md. Tiếp theo nên học xử lý 401/403 tập trung ở Axios và route sau đăng nhập, sau đó bắt đầu nghiệp vụ cart/order.

Ngày 22/09/2026: bài 19 auth error flow: thêm `shared/api/errors.ts` để gom kiểm tra HTTP 400/401/403/404 từ Axios, thêm `markAnonymous` vào auth store, ProductForm xử lý 401 bằng cách clear session client và chuyển về `/login` với `state.from` + `expired`. AuthPage đăng nhập xong quay lại trang cũ nếu `from` hợp lệ. Sửa EditProductPage dùng helper lỗi thay vì import Axios trực tiếp. `DevelopmentAdminSeeder` cũng được làm mềm: thiếu `BootstrapAdmin:Password` chỉ log warning và không làm crash API. Frontend lint/build/test đạt 33 test. Xem lessons/19-auth-error-flow.md. Backend đang chạy local `http://localhost:5005`; lỗi 502 trước đó do backend crash vì user secret admin bootstrap thiếu password.

Ngày 22/09/2026: bài 20 client cart: thêm `features/cart` với Zustand cart store, CartItem snapshot, add/update/remove/clear, total/count helpers và tests. Navbar hiện `Giỏ hàng (n)`, product list/detail có nút thêm vào giỏ, route `/cart` hiển thị item, chỉnh số lượng, xóa và tổng tạm tính; nút Đặt hàng disabled vì chưa có backend order. Cart hiện chỉ ở memory frontend, reload mất, chưa ghi SQL, chưa trừ tồn kho. Frontend lint/build/test đạt 38 test. Xem lessons/20-client-cart.md. Bài tiếp theo nên thiết kế Order/OrderItem backend, server kiểm tra giá/tồn kho, transaction và tạo đơn hàng.

Ngày 22/09/2026: bài 21 backend orders: thêm `Order`/`OrderItem`, quan hệ Identity/Product và snapshot tên hãng, tên TV, giá mua. `POST /api/orders` yêu cầu cookie + CSRF, nhận duy nhất productId/quantity, lấy customer và giá từ server, kiểm tra sản phẩm/tồn kho, tính tổng, giảm Stock và lưu đơn trong transaction Serializable. Migration `20260921200806_AddIdentityAndOrders` đã áp dụng local. Build đạt; kiểm tra HTTP + SQL tạo đơn thành công, Stock 12→11; sau kiểm tra đã xóa order/user test và khôi phục Stock 12. Do phục hồi migration sau một lần EF CLI dùng assembly cũ, các tài khoản Identity local trước đó đã bị reset; role Admin đã được seed lại. Xem `lessons/21-backend-orders.md`. Bài tiếp theo nối CartPage với API đặt hàng và trang xác nhận.

Ngày 22/09/2026: bài 22 customer checkout: thêm `features/orders` với types, Axios `createOrder` + CSRF và trang `/orders/:id/confirmation`. CartPage yêu cầu đăng nhập, gửi duy nhất productId/quantity, giữ cart khi 400/401/lỗi mạng và chỉ clear sau 201; đăng nhập lại quay về `/cart`. Trang xác nhận dùng OrderResponse từ server, hiện chưa reload được vì chưa có GET order by id. Frontend lint/build và 38 test đạt. Đây là luồng Customer. Các form tạo/sửa TV cũ thuộc Admin và cần chuyển sang `/admin` với layout riêng, không trộn vào giao diện Customer. Xem `lessons/22-customer-checkout.md`.

Ngày 22/09/2026: bài 23 tách Customer/Admin UI: thêm nested routes với `CustomerLayout` và `AdminLayout`; `/admin` được bọc `RequireAdmin`. Dashboard, bảng quản lý sản phẩm, tạo và sửa TV chuyển sang `/admin`, có sidebar riêng; catalog và chi tiết Customer không còn nút tạo/sửa. AdminProducts dùng request/state riêng, pageSize 20 nên không kế thừa search/brand từ Zustand catalog Customer. Tài khoản Admin có link chuyển khu vực từ AccountNav. Backend role authorization giữ nguyên và vẫn là lớp bảo vệ thật. Frontend lint/build, 38 test đạt. Xem `lessons/23-customer-admin-layouts.md`.

Ngày 22/09/2026: bài 24 Customer order history: thêm `GET /api/orders` phân trang và `GET /api/orders/{id}`. Cả hai lấy userId từ cookie và lọc CustomerId ngay trong EF query; đơn không có hoặc của user khác đều 404. React thêm RequireAuthenticated, `/orders`, `/orders/:id`; trang chi tiết tự tải API nên refresh được, CartPage chuyển thẳng tới URL đơn. Backend build 0 warning/error; frontend lint/build và 38 test đạt. Integration test hai account xác nhận anonymous 401, owner đọc được, user khác 404/lịch sử rỗng; dữ liệu test đã dọn và stock khôi phục. Xem `lessons/24-customer-order-history.md` và `tests/order-ownership.ps1`.

Ngày 22/09/2026: form đăng ký thêm `confirmPassword`. Zod yêu cầu hai lần nhập khớp và gắn lỗi vào ô xác nhận; transform loại confirmPassword trước khi gọi API nên backend vẫn chỉ nhận email/password. Form đăng nhập không có trường xác nhận. Bổ sung test mismatch và kiểm tra request output không chứa confirmPassword.

Ngày 22/09/2026: form auth thêm nút Hiện/Ẩn mật khẩu. Ô password có ở cả login/register; ô confirm password có toggle độc lập khi đăng ký. Button dùng type=button, aria-label và aria-pressed để không submit form và hỗ trợ accessibility.

Ngày 22/09/2026: đồng bộ password policy frontend/backend theo yêu cầu người học: 8–128 ký tự, cần ít nhất một chữ thường và một chữ số; bỏ bắt buộc chữ hoa và ký tự đặc biệt. RegisterRequest, Identity options, Zod, helper text và test đều dùng cùng quy tắc.

Ngày 22/09/2026: bài 25 order status foundation: thêm enum Pending/Confirmed/Shipped/Completed/Cancelled vào Order, EF lưu nvarchar(20), migration `20260922115948_AddOrderStatus` backfill `Pending` và đã apply local. OrderResponse serialize enum dạng string. React thêm OrderStatus type và badge tiếng Việt ở lịch sử/chi tiết. Backend/frontend build, lint và 39 test đạt; integration order ownership xác nhận create/history/detail đều trả Pending, user khác vẫn 404, SQL không có status sai; dữ liệu test đã dọn. Xem `lessons/25-order-status-foundation.md`.

Ngày 22/09/2026: bài 26 Admin order status: thêm `/api/admin/orders` và PUT status, bảo vệ role Admin + CSRF; transition tối thiểu Pending→Confirmed/Cancelled, Confirmed→Shipped/Cancelled, Shipped→Completed, terminal không đổi. React thêm `/admin/orders`, sidebar, bảng đơn và action tương ứng. Backend/frontend build, lint, 39 test đạt. Integration test Customer 403, Admin list được, transition sai 400, chuỗi hợp lệ 204 và Customer thấy Completed; dữ liệu test đã dọn. Xem `lessons/26-admin-order-status.md`.

Ngày 22/09/2026: bài 27 cancel/restock: AdminOrdersController dùng transaction Serializable, Include OrderItems→Product; khi chuyển sang Cancelled cộng lại từng Quantity trước khi lưu status. Transition terminal chặn hủy lặp nên không hoàn stock hai lần. Backend build 0 warning/error; frontend lint/build và 39 test giữ nguyên. Integration test xác nhận Pending→Completed 400, Confirmed→Cancelled 204, lần hủy tiếp 400, Customer thấy Cancelled và stock trở về đúng giá trị ban đầu; dữ liệu test đã dọn. Xem `lessons/27-cancel-order-restock.md`.

Ngày 22/09/2026: bài 28 persist cart: bọc Zustand cart store bằng persist middleware, key `tv-store-cart`, version 1, JSON localStorage và partialize chỉ lưu items. Các action/checkout không đổi; clear sau 201 tự cập nhật storage. Snapshot client không đáng tin và có thể cũ; backend vẫn lấy giá/tồn kho SQL. Xem `lessons/28-persist-cart.md`.

Bài 9: frontend có Trang trước/Trang sau, Axios params page động/pageSize=2 để thực hành trên 3 TV. Store requestedPage giữ trang cho retry lỗi; chưa persist/đồng bộ URL. Backend không đổi. Build/lint và 5 test store đạt. Hướng dẫn lessons/09-react-pagination.md.

Bài 10 đã thêm tìm tên TV từ React: draftSearch useState, search áp dụng trong Zustand, submit reset page1, giữ từ khóa khi phân trang/retry, clear reset trang1. Axios gửi params search, backend giữ nguyên. Build/lint và 6 test đạt; API local tìm LG và không khớp đạt. Bài lessons/10-react-search.md.

Bài 11: thêm BrandFilter tải GET /api/brands qua Axios với loading/error/retry. brandId trong Zustand, dropdown value ID/name label; đổi hãng reset page1, kết hợp AND với search, paging/retry giữ cả hai. Backend/DB không đổi. Build/lint, 7 test và API combined filters đạt; chưa UI browser test. Xem lessons/11-react-brand-filter.md.

Bài 12: thêm React Router declarative, Link tên TV tới /products/:id; ProductDetailsPage đọc params và Axios getProductById gọi API. Local state chi tiết, abort khi unmount/đổi ID; validation URL, phân biệt 404 và lỗi request có retry; App fallback route. Backend không đổi. Build/lint, 7 test store và API GET3/404 đạt; chưa UI browser test. Bài lessons/12-react-product-details.md.

Bài 13: thêm /products/new, form local state tạo TV bằng Axios POST JSON trực tiếp; lấy brands từ API; map ValidationProblemDetails vào field, khóa submit khi chờ, thành công navigate chi tiết. Backend giữ nguyên, chưa auth. Build/lint, 9 test và API 400/201/GET đạt. Test product ID7 đã xóa riêng, identity có thể tăng. Bài lessons/13-react-create-product.md; chưa UI browser test.

Theo yêu cầu người học: form tạo TV dùng Zod, schema tại features/products/schemas/create-product.ts, safeParse trước Axios, noValidate để hiện lỗi Zod theo field. z.input cho form chuỗi, z.output cho request số; chặn blank trước Number, giữ validation backend và mapping lỗi400. Bài13 đã cập nhật cơ chế mới.

Bài14: thêm /products/:id/edit và link Sửa TV; GET điền form, Zod và PUT đủ4 trường, 204 rồi navigate GET chi tiết. Tách ProductForm dùng chung tạo/sửa, giữ schema cùng quy tắc; UpdateProductRequest alias. Backend không đổi. API test riêng ID9:204/GET,400 bảo toàn dữ liệu,404; đã xóa bản ghi test. Chưa concurrency/auth hay browser UI test. Bài lessons/14-react-edit-product.md.

Bài15 Identity foundation: thêm package Identity.EntityFrameworkCore10.0.11, Models/ApplicationUser:IdentityUser, AppDbContext:IdentityDbContext<ApplicationUser>, giữ base.OnModelCreating, AddIdentityCore/AddRoles/EFStores. Migration20260917115852_AddIdentityAccounts đã apply NothingDb tạo7 bảng AspNet*, users/roles0. Product ID1,2,3,8 và2 hãng giữ nguyên; model snapshot check/filter/pagination đạt, phiên5006 dừng. Chưa auth endpoints/cookie/SignInManager/seed/Authorize. Hướng dẫn lessons/15-identity-foundation.md. Tiếp đăng ký với UserManager rồi cookie/CSRF/roles, từng bước để người học theo dõi.

Bài16 ngày18/09: POST /api/auth/register trong Features/Auth, UserManager.CreateAsync; RegisterRequest Email/Password annotations, response id/email201, Identity errors→ValidationProblem400. UniqueEmail=true, password RequiredLength12 (DTO max128), giữ yêu cầu composition mặc định. Username=email, không trim password, không role từ client/no auto login/no cookie. nothing/auth.http mẫu local. Build/test đăng ký SQL thật và filter đạt, account test GUID đã dọn riêng, phiên5006 dừng. Chưa React register/login cookie/CSRF/rate limit/email confirmation/concurrency handling production. Bài lessons/16-identity-register.md.

Bài17: backend login/me/logout + GET csrf, SignInManager và IdentityCookies. Register/login/logout có ValidateAntiForgeryToken; AddControllersWithViews cung cấp filter. Auth cookie HttpOnly Lax30min sliding, session cookie, Secure Always ngoài dev. CSRF Strict + X-CSRF-TOKEN, lấy mới sau đổi danh tính. Tests cookie/register/filter đạt gồm401,400,204,lockout; không migration. Chưa React auth, role seed, authorization/CSRF catalog, email confirmation/rate limiting/production session hardening. Bài lessons/17-identity-cookie.md; auth.http cập nhật cookie/token thủ công.
