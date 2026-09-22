# Bài 28 — Giữ giỏ hàng sau khi refresh

Giỏ hàng trước đây chỉ nằm trong memory của Zustand. Refresh trang sẽ tạo lại store và mất toàn bộ items. Bài này dùng middleware `persist` của Zustand để lưu phần dữ liệu giỏ vào `localStorage`.

## Cấu hình

```ts
persist(storeCreator, {
  name: 'tv-store-cart',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: state => ({ items: state.items }),
})
```

- `name` là key trong localStorage.
- `version` dành cho việc đổi cấu trúc dữ liệu về sau.
- `partialize` chỉ lưu `items`, không lưu function của store.
- Khi app mở, Zustand đọc JSON và hydrate lại cart.

Các action hiện có không cần đổi. `addProduct`, `updateQuantity`, `removeProduct` và `clear` gọi `set`; middleware tự cập nhật localStorage. Vì vậy đặt hàng thành công rồi `clear()` cũng xóa items đã persist.

## Ranh giới tin cậy

localStorage thuộc quyền kiểm soát của browser. Người dùng có thể sửa giá, stock và quantity trong DevTools. Nó chỉ phục vụ trải nghiệm giữ giỏ hàng, không phải dữ liệu đáng tin.

Khi checkout, frontend vẫn chỉ gửi `productId` và `quantity`. Backend đọc giá/tồn kho thật từ SQL, tính tổng và từ chối số lượng không hợp lệ.

Snapshot giá và tồn kho trong cart có thể cũ nếu catalog thay đổi sau nhiều ngày. Bước sau có thể đồng bộ lại cart với API khi mở trang; hiện tại backend đã bảo vệ tính đúng đắn lúc đặt hàng.
