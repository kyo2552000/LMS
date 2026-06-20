# EduLearn

Website học tập trực tuyến **EduLearn** được xây dựng bằng Next.js, React, Tailwind CSS và MySQL.

## Tính năng chính

- Trang chủ hiển thị khóa học nổi bật và danh mục
- Tìm kiếm, lọc, sắp xếp khóa học
- Xem chi tiết khóa học và danh sách bài học
- Giỏ hàng, thanh toán, theo dõi tiến độ học tập
- Dashboard học viên và khu vực quản trị admin
- Chatbot AI tư vấn khóa học

## Cài đặt nhanh

```bash
npm install
```

Tạo file `.env.local` và cấu hình các biến môi trường cần thiết, sau đó khởi tạo database:

```bash
npm run db:init
npm run db:seed
```

Chạy ứng dụng ở chế độ phát triển:

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

## Lệnh hữu ích

```bash
npm run db:setup
npm run db:reset-pw
npm run report:patch-docx
npm run pptx:edulearn
```

## Yêu cầu hệ thống

- Node.js 18+
- MySQL 8+
- npm

## Ghi chú

Nếu gặp lỗi kết nối database hoặc thiếu biến môi trường, hãy kiểm tra lại file `.env.local` và đảm bảo MySQL đang chạy.
