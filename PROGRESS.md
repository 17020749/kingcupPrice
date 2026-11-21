# Development progress — Kingcup Price

## Định hướng

- Nuxt 4 + Vue 3 + TypeScript.
- Một route giao diện công khai: trang chủ `/`.
- GitHub quản lý mã nguồn; Vercel tự động deploy khi có commit.
- Vercel Blob lưu JSON sản phẩm và ảnh công khai.
- Quản trị dữ liệu bằng hộp thoại trên trang chủ, không thêm trang quản trị riêng.

## Milestones

### 2026-11-20 — Homepage

- [x] Thiết lập Nuxt, TypeScript, scripts và ignore rules.
- [x] Xây trang chủ responsive với hero, danh mục, sản phẩm, quy trình và footer.
- [x] Thêm dữ liệu minh họa, tìm kiếm, lọc danh mục và sắp xếp giá.
- [x] Thêm danh sách báo giá, chỉnh số lượng, xóa và sao chép yêu cầu.
- [x] Viết README và ghi chú cấu trúc dự án.

### 2026-11-20 — Vercel Blob

- [x] Thêm SDK `@vercel/blob` phiên bản 2.9.x.
- [x] Dùng OIDC server-side trên Vercel, không đưa token ghi Blob ra frontend.
- [x] Tạo API đọc catalog JSON và tự khởi tạo từ dữ liệu demo khi Blob chưa có file.
- [x] Tạo API ghi catalog có xác thực quản trị và kiểm soát cập nhật đồng thời bằng ETag.
- [x] Tạo API upload ảnh Public Blob (JPG, PNG, WebP, AVIF; tối đa 4 MB).
- [x] Thêm hộp thoại quản trị trên trang chủ để đăng nhập, thêm, sửa và xóa sản phẩm.
- [x] Ghi tài liệu thiết lập biến môi trường Vercel.

### 2026-11-20 — Blob catalog performance

- [x] Đọc catalog trực tiếp bằng `get('data/catalog.json')`, bỏ bước `list()` rồi mới tải URL.
- [x] Thêm cache trong bộ nhớ theo từng Function instance (TTL 10 giây) và gộp các lượt đọc đồng thời.
- [x] Giữ Blob làm nguồn dữ liệu chính; cập nhật cache instance hiện tại ngay sau khi ghi thành công.
- [x] Dùng `head()` để lấy ETag trước khi ghi, thay cho thao tác `list()` để tìm metadata.
- [x] Giảm shared CDN cache API xuống 5 giây để cân bằng tốc độ và độ mới dữ liệu.
- [ ] Thêm `NUXT_ADMIN_PASSWORD` và `NUXT_ADMIN_SESSION_SECRET` vào Vercel Production và Preview.
- [x] Vercel check cho commit tích hợp Blob đã báo Success.
- [ ] Kiểm tra runtime: đọc catalog, đăng nhập, upload ảnh, thêm/sửa/xóa sản phẩm trên Preview sau khi cấu hình biến môi trường.
- [ ] Sau khi xác nhận upload/ghi Blob bằng OIDC, xem xét thu hồi read-write token cũ nếu token không được dùng ngoài Vercel.
- [ ] Kiểm thử build và CRUD trên Vercel Preview sau khi merge.

## Lưu ý

- Tên hàng, SKU, giá, số lượng tối thiểu và thời gian giao hàng đang là dữ liệu demo.
- Danh sách báo giá hiện chỉ nằm trong state trình duyệt, chưa được gửi/lưu trên server.
- Bản đầu giới hạn upload 4 MB/ảnh do request body của Vercel Functions.
- Xóa sản phẩm chưa tự xóa ảnh cũ trên Blob; cần dọn file mồ côi có chủ đích.
