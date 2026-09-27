# Bài 64 — Admin duyệt thanh toán trên giao diện

Trang chi tiết đơn Admin giờ hiển thị mã giao dịch và thời điểm Customer gửi. Với đơn BankTransfer, Admin có thể bấm `Duyệt đã thanh toán` hoặc nhập lý do rồi `Từ chối`.

Frontend chỉ gọi API; quyền vẫn được kiểm tra ở backend bằng role và CSRF. Sau khi thành công, state cục bộ cập nhật để UI phản ánh trạng thái mới. Backend vẫn là nguồn sự thật, nên refresh trang sẽ tải lại từ SQL Server.
