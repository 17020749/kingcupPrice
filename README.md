# Kingcup Price

Website tra cứu và chuẩn bị báo giá sản phẩm, xây dựng bằng Nuxt 4, Vue 3 và TypeScript.

## Chạy local

Yêu cầu Node.js >= 20.19.0.

```bash
npm install
npm run dev
```

Mở http://localhost:3000.

## Build

```bash
npm run build
npm run preview
```

Tạo static site: `npm run generate`.

## Phạm vi hiện tại

- Chỉ có một route: trang chủ `/`.
- Tìm kiếm theo tên, SKU, mô tả; lọc danh mục và sắp xếp giá.
- Thêm sản phẩm vào danh sách báo giá, điều chỉnh số lượng, xóa và sao chép nội dung.
- Không có API, backend, đăng nhập hoặc database. Danh sách báo giá chỉ tồn tại trong state trình duyệt hiện tại.
- Tên hàng, mã SKU, giá, số lượng tối thiểu và thời gian giao hàng là **dữ liệu minh họa**, cần thay bằng thông tin đã xác nhận trước khi sử dụng thực tế.

## Cấu trúc

- `app/pages`: trang/route.
- `app/components`: component giao diện.
- `app/composables`: state và logic giao diện dùng lại.
- `app/repositories`: điểm truy xuất dữ liệu, hiện đọc dữ liệu local.
- `app/data`: dữ liệu mẫu.
- `app/types`: kiểu dữ liệu TypeScript.
- `app/assets`: CSS và tài nguyên giao diện.

Khi có API, thay implementation trong repository trước; không gọi HTTP trực tiếp bên trong component. Không cần áp dụng Repository Pattern cho các phần UI không truy xuất dữ liệu.

Xem [PROGRESS.md](./PROGRESS.md) để theo dõi tiến độ.
