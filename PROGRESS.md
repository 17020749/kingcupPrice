# Development progress — Kingcup Price

## Định hướng
- Nuxt 4 + Vue 3 + TypeScript.
- Trang chủ duy nhất tại route `/`.
- Chưa có API, backend, authentication hoặc database.
- Dữ liệu demo nằm local và được truy cập qua `productRepository`.
- Kiến trúc feature-oriented: components, composables, repositories, data, types.

## Milestones

### 2026-11-20 — Khởi tạo
- [x] Xác nhận repository trống, nhánh mặc định `main`.
- [x] Chọn Nuxt 4.

### 2026-11-20 — Homepage foundation
- [x] Thiết lập Nuxt, TypeScript, scripts và ignore rules.
- [x] Xây trang chủ responsive với hero, danh mục, sản phẩm, quy trình và footer.
- [x] Thêm dữ liệu demo, tìm kiếm, lọc danh mục và sắp xếp giá.
- [x] Thêm quote drawer, điều chỉnh số lượng, xóa và sao chép yêu cầu.
- [x] Viết README và ghi chú kiến trúc.
- [ ] Cài dependencies và chạy production build trong môi trường local.

## Lưu ý
- Tên sản phẩm, SKU, đơn giá, số lượng tối thiểu và thời gian giao hàng chỉ là dữ liệu minh họa. Cần thay bằng dữ liệu được xác nhận trước khi publish.
- Danh sách báo giá chỉ tồn tại trong state trình duyệt, chưa được gửi hoặc lưu lên server.
