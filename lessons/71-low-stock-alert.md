# Bài 71 — Cảnh báo tồn kho thấp

Admin API `GET /api/admin/inventory/low-stock?threshold=5` trả sản phẩm có tồn kho dưới ngưỡng. Ngưỡng được clamp ở backend để tránh query bất thường. Dashboard Admin hiển thị sản phẩm sắp hết và hết hàng; đây là cảnh báo vận hành, không thay thế kiểm tra tồn kho trong transaction checkout.
