# Hướng dẫn cài đặt dự án EduLearn

Tài liệu này hướng dẫn cách cài đặt và chạy dự án website e-learning **EduLearn** trên máy tính cá nhân.

## 1. Yêu cầu hệ thống

- **Node.js**: phiên bản 18+ (khuyến nghị 20+)
- **npm**: đi kèm với Node.js
- **MySQL**: 8.0 trở lên
- Trình duyệt web hiện đại như Chrome, Edge, Firefox

## 2. Cài đặt mã nguồn

Mở terminal tại thư mục dự án và chạy:

```bash
npm install
```

Lệnh này sẽ tải toàn bộ thư viện cần thiết cho dự án.

## 3. Cấu hình file môi trường

Tạo file `.env.local` ở thư mục gốc của dự án và khai báo các biến môi trường cần thiết. Ví dụ:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=edulearn
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
```

> Lưu ý: giá trị thực tế có thể thay đổi tùy theo cấu hình MySQL và các dịch vụ bạn sử dụng.

## 4. Khởi tạo cơ sở dữ liệu

Dự án có các script sẵn để tạo và thiết lập database.

### 4.1 Tạo cấu trúc database

```bash
npm run db:init
```

### 4.2 Thiết lập toàn bộ database

```bash
npm run db:setup
```

### 4.3 Nạp dữ liệu mẫu

```bash
npm run db:seed
```

## 5. Chạy ứng dụng ở chế độ phát triển

Sau khi cài đặt và cấu hình xong, chạy:

```bash
npm run dev
```

Sau đó mở trình duyệt và truy cập:

```bash
http://localhost:3000
```

## 6. Build và chạy bản production

### 6.1 Build dự án

```bash
npm run build
```

### 6.2 Chạy bản production

```bash
npm run start
```

## 7. Tài khoản đăng nhập

Sau khi seed dữ liệu, bạn có thể đăng nhập bằng tài khoản mẫu trong cơ sở dữ liệu. Nếu chưa có tài khoản, hãy kiểm tra file seed để xem thông tin tài khoản mặc định.

## 8. Các chức năng chính của hệ thống

- Trang chủ hiển thị khóa học nổi bật và danh mục
- Tìm kiếm, lọc và sắp xếp khóa học
- Xem chi tiết khóa học và danh sách bài học
- Giỏ hàng và thanh toán
- Theo dõi tiến độ học tập
- Dashboard học viên
- Khu vực quản trị admin
- Chatbot AI tư vấn khóa học

## 9. Một số lệnh hữu ích

### Reset mật khẩu

```bash
npm run db:reset-pw
```

### Xuất / cập nhật tài liệu báo cáo

```bash
npm run report:patch-docx
```

### Tạo file slide thuyết trình

```bash
npm run pptx:edulearn
```

## 10. Xử lý lỗi thường gặp

### Lỗi không kết nối được MySQL
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra lại thông tin `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Lỗi thiếu biến môi trường
- Kiểm tra file `.env.local`
- Đảm bảo các biến bắt buộc đã được khai báo

### Lỗi cài đặt thư viện
- Xóa thư mục `node_modules` và file `package-lock.json` nếu cần
- Chạy lại:

```bash
npm install
```

## 11. Kết luận

Sau khi hoàn tất các bước trên, bạn có thể chạy và sử dụng dự án EduLearn bình thường trên máy local.

Nếu cần mở rộng hoặc triển khai lên server, hãy đảm bảo cấu hình lại biến môi trường và database cho phù hợp.
