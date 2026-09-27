# Bài 67 — Ownership và moderation review

Review giờ có thể sửa/xóa bởi đúng Customer đã tạo review. API lấy `CustomerId` từ cookie và lọc theo cả `ProductId`, `ReviewId`, `CustomerId`; client không thể truyền user khác để chiếm review.

Admin có endpoint ẩn/hiện review qua role `Admin` và CSRF. Review ẩn không xuất hiện ở API public nhưng vẫn giữ trong database để audit và có thể khôi phục. Migration thêm `IsVisible`.
