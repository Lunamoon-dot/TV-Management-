# Lộ trình web bán TV

## Mục tiêu và cách làm

Xây sản phẩm React + ASP.NET Core Web API + SQL Server hoàn chỉnh đến triển khai, dựa trên project đang học. Người học đã có kinh nghiệm React/Express/MongoDB. Học bằng tính năng thực tế, giải thích rõ điểm khác của .NET và SQL; không yêu cầu học hết lý thuyết trước khi bắt đầu.

Các mục bên dưới là định hướng đề xuất để đáp ứng yêu cầu chất lượng; chưa phải tất cả đều đã chốt phạm vi hoặc được triển khai. Làm từng mốc có kết quả kiểm tra được. Chuyên nghiệp được đánh giá bằng tính đúng đắn, bảo mật, khả năng bảo trì và vận hành.

Mô hình nghiệp vụ dựa trên `btl.drawio` do người học cung cấp, mở rộng cho cả quản lý và khách hàng. Xem `DATA_MODEL.md` để biết mapping bảng gốc, các entity bổ sung, quan hệ và quy tắc dữ liệu. Giữ các phần nhân viên, nhà cung cấp, nhập hàng và hóa đơn; thêm các luồng web chứ không thay toàn bộ mô hình bằng một demo cửa hàng khác.

## Trạng thái ban đầu

- Có GET danh sách, GET theo ID, POST, PUT và DELETE cho Product; SQL Server local đã được kiểm tra thực tế. DELETE hoàn thành ngày 13/09/2026 với TV mẫu riêng.
- Đã triển khai Brand–Product, migration/backfill, GET /api/brands và DTO nhận brandId/trả tên hãng. Xem lessons/02-brand-migration.md.
- Chưa có React, Identity, phân quyền, bộ kiểm thử tự động hay pipeline deploy.
- Cần xử lý precision của Price, ràng buộc dữ liệu và hợp đồng PUT (đặc biệt Stock bị bỏ qua thành 0) trước khi coi API sản phẩm là hoàn thiện.

## 1. Hoàn thiện nền tảng API sản phẩm

- Hoàn thành DELETE và phân biệt xóa dữ liệu với ngừng bán; khi có đơn hàng phải bảo toàn lịch sử sản phẩm đã mua.
- Chuẩn hóa request/response DTO, validation, mã HTTP và định dạng lỗi ProblemDetails.
- Cấu hình dữ liệu: decimal cho giá, giới hạn độ dài, ràng buộc tồn kho/giá ở DB, migration có kiểm tra.
- Thêm phân trang có giới hạn, lọc/tìm kiếm và sắp xếp ổn định khi xây màn hình danh sách.
- Học DI và lifetime của DbContext, middleware và exception handling qua code đang dùng.
- Kiểm chứng: test tích hợp cho API và database, dữ liệu sai/không tồn tại không tạo thay đổi ngoài ý muốn.

## 2. Tổ chức code và route

- Đề xuất một backend triển khai chung, chia theo tính năng Products, Auth, Orders; React là ứng dụng frontend riêng.
- Chuyển dần từ thư mục hiện tại khi hoàn thiện module; không đổi hàng loạt trước khi người học hiểu trách nhiệm từng phần.
- Hướng folder backend: `Features/Products` chứa controller, DTO và nghiệp vụ sản phẩm; `Data` chứa DbContext/cấu hình EF; `Models` giữ entity hiện tại; `Migrations` giữ migration; thêm Auth/Orders và code dùng chung khi cần. Đây là hướng đề xuất, chưa phải cấu trúc hiện có.
- Controller xử lý HTTP; service xử lý nghiệp vụ khi có nghiệp vụ cần tách; EF Core đảm nhiệm truy cập dữ liệu. Không bắt buộc thêm repository bọc mọi thao tác EF hoặc tách nhiều project ngay.
- Route là hợp đồng HTTP, không phụ thuộc trực tiếp tên folder: `/api/products`, `/api/products/{id}`, các nhóm auth/order sẽ thiết kế khi triển khai.
- Kiểm chứng: trách nhiệm và dependency rõ, hợp đồng API ổn định, có test tại phần nghiệp vụ quan trọng.

## 3. React kết nối backend

- Làm một luồng đầy đủ: trang danh sách/chi tiết TV và form quản trị tạo/sửa sản phẩm.
- API client tập trung, kiểu TypeScript khớp DTO; ánh xạ lỗi validation backend về form, loading/empty/error và tải lại dữ liệu sau mutation.
- Thiết lập cấu hình môi trường và dev proxy hoặc CORS phù hợp; không đưa secret của backend vào frontend.
- Đề xuất production phục vụ React và `/api` dưới cùng origin qua reverse proxy để đơn giản hóa cookie; cách hosting cụ thể chốt sau.
- Kiểm chứng: thao tác từ UI được lưu DB và hiển thị lại sau refresh. Màn hình quản trị chỉ được public sau khi có auth/phân quyền ở mốc kế tiếp.

## 4. Identity + cookie và phân quyền

- Hướng ưu tiên của người học: ASP.NET Core Identity quản lý tài khoản/mật khẩu; cookie authentication duy trì đăng nhập cho browser. React vẫn làm giao diện.
- Đăng ký, đăng nhập, đăng xuất, lấy người dùng hiện tại; xác nhận email, quên/đặt lại mật khẩu, giới hạn thử đăng nhập. MFA cho admin thuộc phạm vi cần xem xét trước public.
- Phân quyền Customer/Admin ở backend; kiểm tra quyền sở hữu khi đọc/sửa dữ liệu cá nhân và đơn hàng. Ẩn nút ở React không thay thế authorization.
- Cookie HttpOnly/Secure, chính sách SameSite phù hợp; chống CSRF cho thao tác có tác dụng phụ, kể cả các luồng auth liên quan; CORS không thay thế CSRF protection.
- Thiết kế session expiry, đăng xuất/thu hồi quyền và xử lý 401/403 trên React. Không mặc định coi Identity + cookie đã là hệ thống session lưu hoàn toàn ở server.
- Persist và bảo vệ Data Protection keys khi deploy/restart hoặc chạy nhiều instance; không log mật khẩu, cookie hay token.
- Kiểm chứng: anonymous không sửa catalog, customer không gọi API admin hoặc đọc đơn người khác, request thiếu CSRF protection bị chặn, cookie hoạt động qua restart theo chính sách đã chọn.

## 5. Nghiệp vụ bán TV

- Phạm vi đề xuất: catalog thông số TV/hãng/ảnh, tìm kiếm và lọc, giỏ hàng, đặt hàng, lịch sử đơn, quản trị catalog và trạng thái đơn.
- Theo sơ đồ gốc: thêm quản lý danh mục TV, nhân viên/công việc/ca làm, nhà cung cấp, nhập hàng và hóa đơn bán. Customer liên kết Identity; Order online tách SalesInvoice. Quy tắc một nguồn cập nhật tồn kho cho mỗi nghiệp vụ được mô tả trong DATA_MODEL.md.
- Thiết kế quan hệ, khóa ngoại, index; lưu snapshot tên/giá vào dòng đơn hàng để lịch sử không đổi theo catalog.
- Server tính giá/tổng tiền; transaction và kiểm soát cập nhật đồng thời để tránh bán vượt tồn kho; xử lý submit lặp.
- Ảnh qua object storage, kiểm tra upload và giới hạn kích thước; DB lưu metadata/đường dẫn.
- Thanh toán, giao hàng, hoàn tiền và các tính năng thương mại bổ sung cần chốt phạm vi. Bắt đầu sandbox nếu tích hợp cổng thanh toán; kiểm tra webhook và tính idempotent trước giao dịch thật.
- Kiểm chứng: luồng từ chọn TV đến tạo đơn đúng giá/tồn kho, request lặp và hai người mua đồng thời được xử lý đúng.

## 6. SQL trên cloud và bản staging

- Chọn dịch vụ SQL tương thích sau khi chốt ngân sách/vùng triển khai; không mặc định chọn nhà cung cấp hoặc mua dịch vụ.
- Phân biệt SQL Server local với dịch vụ SQL managed; xác thực cloud, quyền tối thiểu, TLS, firewall/private networking, secret management và connection pooling.
- Học timeout, transient error/retry và transaction; retry không được gây tạo đơn hai lần.
- Triển khai migration có review qua pipeline/script/bundle, chạy thử trên staging, chuẩn bị backup/restore; tách quyền migrate khỏi quyền runtime khi phù hợp.
- Theo dõi truy vấn chậm, index, latency và chi phí. Tách database dev/staging/production.
- Đưa bản staging lên sớm sau khi có luồng React + auth để kiểm tra HTTPS, cookie và kết nối cloud trong môi trường thật.

## 7. Hoàn thiện và triển khai

- CI chạy build/lint/test; unit test nghiệp vụ, integration test API/SQL, E2E các luồng mua hàng và quản trị quan trọng.
- CD lên staging rồi production; health checks, log có correlation ID, theo dõi lỗi/hiệu năng, cảnh báo và quy trình rollback.
- Domain/HTTPS, cấu hình reverse proxy, secrets, Data Protection keys, backup và diễn tập restore; kiểm tra quyền và CSRF trước public.
- Tài liệu chạy local, sơ đồ kiến trúc, hợp đồng API, quy trình migration/deploy và xử lý sự cố.
- Hoàn thành khi chức năng đã thống nhất chạy end-to-end trên môi trường deploy, kiểm thử đạt, quyền truy cập đúng, dữ liệu có thể khôi phục và người học giải thích được luồng xử lý.

## Bước kế tiếp đề xuất

Đọc hiểu Brand–Product đã triển khai: FK, navigation, migration/backfill và DTO; rồi chuyển sang mốc API sản phẩm + React đầu tiên. Kể cả case phức tạp cũng chia thành các bài nhỏ để người học theo sát và hỏi sau từng bước, không tự triển khai nhiều module liên tiếp. Không cần chờ học hết C# hoặc EF Core. Đánh giá tiến độ bằng các mốc chạy được và hiểu được; chưa ước lượng ngày hoàn thành khi chưa biết thời gian học mỗi tuần và phạm vi thương mại cuối cùng.

## Tài liệu nền

- [Identity cho SPA và cookie](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-10.0)
- [Chống CSRF trong ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0)
- [Triển khai EF Core migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying)
- [EF Core connection resiliency](https://learn.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency)

## Tiến độ Identity — bài15
Đã triển khai model ApplicationUser, IdentityDbContext và migration7 bảng Identity, đăng ký dịch vụ lõi/roles/EF stores. Chưa triển khai endpoint auth, cookie, CSRF, seed hoặc phân quyền. Tiếp theo học UserManager và đăng ký tài khoản; giữ tiến độ từng bài nhỏ.

## Tiến độ Identity — bài18

Đã có register/login/logout/me bằng cookie, CSRF cho mutation và role `Admin` bảo vệ POST/PUT/DELETE catalog. React dùng Zustand session + `/me` để chỉ hiện và cho truy cập UI quản trị; backend vẫn là lớp bảo vệ quyết định. Seeder Admin chỉ dùng Development + User Secrets, không có password trong source. Chưa có email confirmation, password reset, rate limiting, Customer role nghiệp vụ, hay quản trị role production.

## Tiến độ Identity — bài19

Đã xử lý luồng frontend khi cookie hết hạn hoặc thiếu quyền: helper lỗi HTTP cho Axios, form quản trị hiểu 400/401/403/404, 401 sẽ chuyển về login và đăng nhập xong quay lại trang đang làm. Đây là UX client; bảo mật vẫn dựa vào `[Authorize]` và CSRF ở backend. Bước auth cơ bản đã đủ để bắt đầu nghiệp vụ khách hàng như giỏ hàng và đơn hàng.

## Tiến độ Cart/Order — bài20

Đã có giỏ hàng frontend bằng Zustand: thêm TV từ danh sách/chi tiết, xem `/cart`, chỉnh số lượng, xóa item và xem tổng tạm tính. Đây mới là client cart, chưa lưu DB và chưa tạo order; backend vẫn phải kiểm tra lại productId/quantity, giá, tồn kho và quyền user khi đặt hàng thật. Bước tiếp theo là thiết kế `Order`/`OrderItem`, migration và endpoint tạo đơn bằng transaction.

## Tiến độ Cart/Order — bài21

Đã có schema `Order`/`OrderItem` và `POST /api/orders` cho người dùng đăng nhập. Server không tin giá/tổng tiền từ frontend: chỉ nhận productId/quantity, đọc giá và tồn kho từ SQL, lưu snapshot lịch sử, giảm tồn kho và commit bằng transaction Serializable. Endpoint đã được kiểm tra với cookie, CSRF và SQL thật; dữ liệu thử đã dọn. Frontend chưa gọi endpoint này. Bài tiếp theo nối nút Đặt hàng, chỉ clear cart sau response 201 và hiển thị xác nhận đơn.

## Tiến độ Cart/Order — bài22

Customer đã đặt hàng được từ `/cart`: React gửi productId/quantity qua Axios cùng CSRF, backend trả OrderResponse, cart chỉ bị xóa sau 201 và app chuyển tới `/orders/{id}/confirmation`. 401 đưa về login rồi quay lại cart; các lỗi khác giữ nguyên giỏ. Trang xác nhận hiện phụ thuộc Router state nên refresh chưa tải lại đơn. Route Customer và Admin đã được xác định là hai khu vực UI riêng; bước tổ chức tiếp theo chuyển form quản trị catalog sang `/admin` và `AdminLayout`, còn backend tiếp tục bảo vệ bằng role.

## Tiến độ tổ chức frontend — bài23

Đã tách hai cây route: `CustomerLayout` cho catalog/cart/auth/order và `AdminLayout` cho dashboard/quản lý sản phẩm dưới `/admin`. Customer không còn nút tạo/sửa; Admin có bảng riêng và form tại `/admin/products/new`, `/admin/products/{id}/edit`. `RequireAdmin` bảo vệ cây route về UX, còn `[Authorize(Roles = Admin)]` ở API tiếp tục quyết định quyền thật. Tiếp theo nên thêm API đọc đơn theo Customer để trang xác nhận refresh được và xây lịch sử đơn cá nhân.

## Tiến độ Customer Orders — bài24

Customer có lịch sử `/orders` và chi tiết `/orders/{id}` tải từ SQL, có phân trang và hoạt động sau refresh. Backend lấy customer từ cookie, không nhận customerId từ client; query luôn lọc quyền sở hữu và trả 404 cho ID của người khác. Integration test bằng hai tài khoản đã xác nhận cách ly dữ liệu. Tiếp theo nên bổ sung trạng thái đơn hàng và thiết kế luồng Admin xử lý đơn, sau đó Customer theo dõi trạng thái.

## Tiến độ Order Status — bài25

Order có trạng thái lưu dạng chuỗi: Pending, Confirmed, Shipped, Completed, Cancelled. Đơn mới và dữ liệu cũ đều bắt đầu Pending; API trả chuỗi enum và Customer thấy badge tiếng Việt trong lịch sử/chi tiết. Chưa có endpoint đổi trạng thái. Bước tiếp theo xây Admin Orders và giới hạn các transition hợp lệ.

## Tiến độ Admin Orders — bài26

Admin có `/admin/orders`, API phân trang và PUT status với CSRF. Backend chỉ chấp nhận transition tuần tự; Customer không gọi được API Admin. Bản này cố ý giữ đơn giản, chưa có audit log, ghi chú nội bộ, thông báo, hoàn kho khi hủy hoặc xử lý concurrency giữa hai Admin. Bước tiếp theo nên xử lý hủy đơn và hoàn tồn kho đúng transaction trước khi mở rộng giao diện.

## Tiến độ hủy đơn — bài27

Hủy đơn từ Pending/Confirmed đã hoàn lại tồn kho và đổi trạng thái trong cùng transaction Serializable. Hủy lặp bị chặn nên không cộng kho hai lần; Shipped không thể hủy trong workflow hiện tại. Chưa có hoàn tiền, trả hàng, audit log hay notification. Bước tiếp theo nên quay lại Customer để persist giỏ hàng qua refresh hoặc bổ sung thông tin giao hàng trước khi checkout.

## Tiến độ Cart — bài28

Cart được persist trong localStorage bằng Zustand middleware và sống qua refresh; chỉ items được lưu, clear sau checkout cũng xóa storage. Client snapshot vẫn không phải nguồn giá/tồn kho đáng tin. Bước tiếp theo nên thêm thông tin người nhận và địa chỉ giao hàng vào checkout/order trước khi mở rộng các module khác.

## Tiến độ Checkout — bài29

Đơn hàng đã lưu snapshot tên người nhận, số điện thoại và địa chỉ giao hàng. Form giỏ hàng dùng Zod, API validate lại bằng DTO và dữ liệu được trả trong chi tiết đơn sau refresh. Chưa có address book hoặc nhiều bước checkout. Bước tiếp theo nên chống tạo đơn lặp khi người dùng double-click hoặc client retry request.

## Tiến độ Checkout — bài30

Tạo đơn đã idempotent theo cặp Customer và CheckoutId. Retry cùng khóa trả lại đơn cũ; SQL unique index bảo vệ dữ liệu và integration test xác nhận lịch sử chỉ có một đơn. Bước tiếp theo phù hợp là bổ sung ảnh/thông số cho catalog hoặc bắt đầu luồng thanh toán giả lập, tùy mục tiêu học ưu tiên.

## Tiến độ Customer Orders — bài31

Customer đã tự hủy được đơn Pending; đơn không thuộc tài khoản trả 404, hủy lặp bị chặn và tồn kho được hoàn đúng một lần. Admin và Customer dùng chung `OrderCancellationService`, nhưng có quy tắc trạng thái khác nhau. Bước tiếp theo nên làm catalog giống sản phẩm thật hơn bằng ảnh và thông số TV trước khi mô phỏng thanh toán.

## Tiến độ Catalog — bài32

Catalog đã có URL ảnh, kích thước màn hình và độ phân giải; Admin tạo/sửa bằng form Zod, Customer thấy ảnh và thông số ở card/chi tiết. Migration giữ field nullable cho sản phẩm cũ, còn request mới bắt buộc dữ liệu. Chưa có upload ảnh, object storage hoặc bộ thông số động theo danh mục.

## Tiến độ Payment — bài33

Đơn hàng đã lưu PaymentMethod (COD/chuyển khoản) và PaymentStatus tách biệt với trạng thái giao hàng. Customer chọn phương thức khi checkout và xem lại trong lịch sử/chi tiết; mọi đơn mới bắt đầu Unpaid. Chưa có giao dịch thanh toán, webhook, mã tham chiếu hoặc quy trình xác minh Paid.

## Tiến độ Payment — bài34

Admin đã xác nhận thanh toán thủ công từ Unpaid sang Paid; endpoint có role, CSRF và idempotent khi gọi lặp. Customer thấy kết quả nhưng không có quyền thay đổi. Đơn Paid không thể hủy khi chưa có refund workflow. Chưa có provider transaction, webhook, chữ ký, đối soát tự động hoặc hoàn tiền.

## Tiến độ Payment — bài35

Thanh toán thủ công có audit tối thiểu gồm PaidAt và snapshot email Admin xác nhận; retry giữ nguyên dấu vết đầu tiên. Customer chỉ nhận PaidAt, Admin nhận đủ audit. Chưa có bảng payment transaction/audit event bất biến hoặc correlation ID.

## Tiến độ Admin Orders — bài36

Admin có trang chi tiết tại `/admin/orders/:id` và API projection trả thông tin Customer, snapshot giao hàng, payment audit cùng các sản phẩm của một đơn. Danh sách tiếp tục dùng DTO tóm tắt để không tải items dư thừa. Customer gọi API Admin nhận 403. Chưa có ghi chú nội bộ hoặc lịch sử từng lần chuyển trạng thái.

## Tiến độ Order Status — bài37

Đơn hàng có timeline trạng thái bất biến: trạng thái cũ/mới, thời gian và email người thao tác. Tạo đơn và mọi transition hợp lệ đều ghi trong cùng transaction; migration backfill mốc hiện tại cho đơn cũ. Admin xem timeline ở chi tiết đơn. Chưa có ghi chú nội bộ, lý do hủy hoặc audit cho các thay đổi ngoài trạng thái.

## Tiến độ Order Status — bài38

Hủy đơn bắt buộc reason 5–300 ký tự ở cả Customer và Admin; Zod và backend cùng validate. Reason nằm trên sự kiện Cancelled trong timeline và được commit cùng hoàn kho/trạng thái. Chưa có reason code phục vụ thống kê hoặc ghi chú nội bộ không gắn với transition.

## Tiến độ Admin Orders — bài39

Admin có thể thêm và đọc ghi chú nội bộ trên chi tiết đơn; mỗi note lưu nội dung, thời gian và snapshot email người tạo. API dùng role + CSRF, Customer bị chặn và DTO Customer không trả notes. Chưa hỗ trợ sửa/xóa note, nhờ đó lịch sử trao đổi hiện tại chỉ được bổ sung.
