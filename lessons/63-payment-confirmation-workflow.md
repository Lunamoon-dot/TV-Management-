# Bài 63 — Xác nhận chuyển khoản thủ công

Customer đặt đơn với `BankTransfer`, nhập mã giao dịch ở trang chi tiết đơn và backend chuyển sang `PendingReview`. Customer không thể tự đặt `Paid`.

Admin kiểm tra giao dịch rồi duyệt `Paid` hoặc từ chối với lý do bắt buộc. Chỉ order owner được gửi submission; chỉ Admin được duyệt; order đã hủy không nhận submission.

Migration thêm `PaymentReference`, `PaymentSubmittedAt` và `PaymentRejectedReason`; trạng thái mới là `PendingReview` và `Rejected`.

Đây vẫn là quy trình thủ công. Chưa có cổng thanh toán hoặc webhook; sau này webhook phải dùng cùng state transition và không tin dữ liệu từ browser.
