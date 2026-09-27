# Bài 65 — Nền tảng MoMo IPN/webhook

Đợt này gộp năm bước payment:

1. Thêm `Momo` vào lựa chọn thanh toán.
2. Tạo contract IPN theo payload MoMo.
3. Xác minh `signature` bằng HMAC-SHA256 ở backend.
4. Kiểm tra `orderId`, số tiền và phương thức trước khi ghi `Paid`.
5. Làm idempotent: callback lặp cho đơn đã `Paid` chỉ trả thành công, không ghi lại.

MoMo dùng HMAC-SHA256 với chuỗi field được sắp xếp theo format của API. Secret chỉ nằm ở environment/secret store (`Momo:SecretKey`, `Momo:AccessKey`). IPN không dùng CSRF vì request đến từ server MoMo; chữ ký mới là lớp xác thực chính.

Đây là foundation cho sandbox. Bước tiếp theo sẽ tạo payment URL bằng endpoint MoMo sandbox và lưu request/transaction id; không nên đánh dấu `Paid` dựa trên redirect của trình duyệt.
