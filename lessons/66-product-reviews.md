# Bài 66 — Đánh giá sản phẩm

Customer có thể xem review công khai và gửi review khi đã có order chứa sản phẩm đó. Backend lấy Customer từ cookie, không nhận `userId` từ client; review trùng của cùng Customer/sản phẩm bị chặn bằng cả kiểm tra API và unique index SQL.

Review gồm rating 1–5, comment 5–1000 ký tự và thời gian tạo. Frontend dùng Zod trước khi gửi, còn DTO/DataAnnotations và database tiếp tục bảo vệ backend. Đây là nền tảng để bài sau thêm sửa/xóa review của chủ sở hữu và moderation cho Admin.
