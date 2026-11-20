# Kingcup Price

Website tra cứu sản phẩm và chuẩn bị yêu cầu báo giá, xây dựng bằng Nuxt 4, Vue 3 và TypeScript.

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

## Kiến trúc

- Chỉ có một route giao diện công khai: trang chủ `/`.
- Tìm kiếm theo tên, SKU, mô tả; lọc danh mục và sắp xếp giá.
- Danh sách báo giá cho phép thêm sản phẩm, chỉnh số lượng, xóa và sao chép nội dung.
- Hộp thoại quản trị mở từ cuối trang chủ, không tạo route quản trị riêng.
- Dữ liệu sản phẩm và danh mục nằm trong `data/catalog.json` trên Vercel Blob.
- Ảnh sản phẩm nằm trong `images/products/` trên Public Vercel Blob.
- GitHub chỉ lưu mã nguồn; cập nhật sản phẩm/ảnh không tạo commit và không kích hoạt deploy.
- API ghi dữ liệu trong Nuxt server routes, được bảo vệ bằng mật khẩu quản trị và cookie phiên HMAC.

## Cấu hình Vercel

Blob Store cần được kết nối với Project trên môi trường Production và Preview. Code dùng OIDC của Vercel qua `@vercel/blob`; không đưa Blob token vào frontend hoặc repository.

Trong Vercel Project → Settings → Environment Variables, tạo hai biến cho Production và Preview:

- `NUXT_ADMIN_PASSWORD`: mật khẩu quản trị mạnh và duy nhất.
- `NUXT_ADMIN_SESSION_SECRET`: chuỗi ngẫu nhiên tối thiểu 32 ký tự.

Có thể sinh session secret bằng:

```bash
openssl rand -base64 48
```

Sau khi thêm biến môi trường, redeploy Project để Functions nhận cấu hình. Không commit giá trị bí mật.

## Upload ảnh

Bản đầu dùng server upload để dùng OIDC mà không cần token dài hạn trong trình duyệt. Chấp nhận JPG, PNG, WebP, AVIF và giới hạn 4 MB mỗi ảnh (giới hạn request của Vercel Functions là 4.5 MB).

## Khởi tạo dữ liệu

Lần đầu gọi `/api/catalog`, nếu Blob chưa có `data/catalog.json`, server tự tạo file JSON từ dữ liệu mẫu hiện có. Đây là dữ liệu minh họa; cần thay bằng dữ liệu/giá đã được xác nhận trước khi sử dụng chính thức.

## Local development

OIDC được Vercel cấp cho Functions đang chạy trên Vercel. Để kiểm tra đầy đủ thao tác Blob, ưu tiên deploy Preview trên Vercel. Nếu thử bằng server local, cần thiết lập credential Blob chỉ dành cho local trong file env không commit; không dùng token đó ở frontend.

## Lưu ý vận hành

- Catalog giới hạn tối đa 500 sản phẩm và 40 danh mục trong bản đầu.
- Xóa sản phẩm không tự xóa ảnh cũ khỏi Blob để tránh xóa nhầm file còn được tham chiếu. Có thể dọn file mồ côi sau.
- Danh sách báo giá hiện chỉ được giữ trong state của trình duyệt; chưa gửi email hoặc lưu yêu cầu lên server.
- Mật khẩu quản trị hiện là một mật khẩu chung do chủ dự án cấu hình, chưa có nhiều tài khoản/role.

Theo dõi công việc trong [PROGRESS.md](./PROGRESS.md).
