# Bài 68 — Wishlist API

Wishlist lưu quan hệ Customer–Product ở bảng riêng, có unique index để thêm lặp không tạo bản ghi trùng. Customer chỉ đọc/thêm/xóa wishlist của chính mình; mọi mutation dùng cookie identity và CSRF.
