# ⚙️ BACKEND — Xử lý dữ liệu & Logic server

> Tất cả file dưới đây chạy trên **server Node.js**, xử lý HTTP requests, tương tác MySQL.
> Nhận diện: nằm trong `app/api/`, export `GET/POST/PUT/DELETE`, import `db`, `NextResponse`.

---

## 🔌 API ROUTES — Endpoints

### 📚 Khóa học & Nội dung

| STT | File | Method | URL | Chức năng |
|-----|------|--------|-----|-----------|
| 1 | `app/api/courses/route.ts` | `GET` | `/api/courses` | Danh sách khóa học (filter: category, level, type, search, page) |
| 2 | `app/api/courses/[id]/route.ts` | `GET` | `/api/courses/:id` | Chi tiết khóa học + lessons + reviews + enrollment status |
| 3 | `app/api/categories/route.ts` | `GET` | `/api/categories` | Danh sách danh mục |
| 4 | `app/api/reviews/route.ts` | `GET/POST` | `/api/reviews` | Đánh giá khóa học |
| 5 | `app/api/comments/route.ts` | `GET/POST` | `/api/comments` | Bình luận bài học |
| 6 | `app/api/lesson-progress/route.ts` | `GET/POST` | `/api/lesson-progress` | Tiến độ hoàn thành bài học |

### 💳 Thanh toán & Đơn hàng

| STT | File | Method | URL | Chức năng |
|-----|------|--------|-----|-----------|
| 7 | `app/api/orders/route.ts` | `GET` | `/api/orders` | Lấy đơn hàng (user hoặc admin) |
| 8 | `app/api/orders/route.ts` | `POST` | `/api/orders` | Tạo đơn hàng mới |
| 9 | `app/api/orders/route.ts` | `PUT` | `/api/orders` | Cập nhật trạng thái → **AUTO ENROLL khi PAID** |
| 10 | `app/api/enrollments/route.ts` | `GET/POST` | `/api/enrollments` | Ghi danh (free course) |
| 11 | `app/api/coupons/route.ts` | `GET/POST` | `/api/coupons` | Mã giảm giá |

### ❤️ Yêu thích & Thống kê

| STT | File | Method | URL | Chức năng |
|-----|------|--------|-----|-----------|
| 12 | `app/api/favorites/route.ts` | `GET` | `/api/favorites` | Lấy danh sách yêu thích của user |
| 13 | `app/api/favorites/route.ts` | `GET` | `/api/favorites?stats=top` | Top khóa học được yêu thích nhất |
| 14 | `app/api/favorites/route.ts` | `POST` | `/api/favorites` | Toggle yêu thích (thêm/bỏ) |

### 👤 Xác thực & Người dùng

| STT | File | Method | URL | Chức năng |
|-----|------|--------|-----|-----------|
| 15 | `app/api/auth/route.ts` | `GET` | `/api/auth` | Lấy thông tin user hiện tại (từ JWT cookie) |
| 16 | `app/api/auth/route.ts` | `POST` | `/api/auth` | Đăng nhập / Đăng ký |
| 17 | `app/api/auth/route.ts` | `DELETE` | `/api/auth` | Đăng xuất (xóa cookie) |
| 18 | `app/api/profile/route.ts` | `GET/PUT` | `/api/profile` | Xem & cập nhật hồ sơ |
| 19 | `app/api/dashboard/route.ts` | `GET` | `/api/dashboard` | Thống kê dashboard học viên |

### 🛡️ Quản trị (Admin)

| STT | File | Method | URL | Chức năng |
|-----|------|--------|-----|-----------|
| 20 | `app/api/admin/route.ts` | `GET` | `/api/admin` | Dashboard stats (revenue, favorites, charts) |
| 21 | `app/api/admin/[table]/route.ts` | `GET` | `/api/admin/:table` | Đọc dữ liệu bảng bất kỳ (phân trang) |
| 22 | `app/api/admin/[table]/route.ts` | `POST` | `/api/admin/:table` | Thêm bản ghi mới |
| 23 | `app/api/admin/[table]/route.ts` | `PUT` | `/api/admin/:table` | Sửa bản ghi |
| 24 | `app/api/admin/[table]/route.ts` | `DELETE` | `/api/admin/:table` | Xóa bản ghi |

### 🔧 Tiện ích

| STT | File | Method | URL | Chức năng |
|-----|------|--------|-----|-----------|
| 25 | `app/api/upload/route.ts` | `POST` | `/api/upload` | Upload file (ảnh, video, docx) |
| 26 | `app/api/parse-docx/route.ts` | `GET` | `/api/parse-docx` | Chuyển DOCX → HTML để hiển thị |
| 27 | `app/api/chat/route.ts` | `POST` | `/api/chat` | AI Chatbot (Google Gemini API) |

---

## 🔧 BACKEND UTILITIES (Thư viện phía server)

| File | Chức năng | Chi tiết |
|------|-----------|----------|
| `lib/db.ts` | Kết nối MySQL | `mysql2/promise` connection pool |
| `lib/auth.ts` | Xác thực JWT | `getAuthUser()` — đọc JWT từ cookie, trả về user info |

---

## 🗄️ DATABASE — Cơ sở dữ liệu MySQL

### Schema (Cấu trúc bảng)

| File | Chức năng |
|------|-----------|
| `sql/init.sql` | Tạo tất cả bảng (DROP + CREATE) |
| `sql/seed.js` | Seed dữ liệu mẫu (12 khóa học, users, lessons...) |
| `sql/migrate-favorites.js` | Migration thêm bảng favorites |

### Danh sách bảng trong database `edulearn`

| STT | Tên bảng | Mô tả | Quan hệ chính |
|-----|----------|-------|---------------|
| 1 | `users` | Người dùng (admin, instructor, student) | — |
| 2 | `roles` | Vai trò (ADMIN, INSTRUCTOR, STUDENT, GUEST) | — |
| 3 | `permissions` | Quyền hạn | → roles (nhiều-nhiều) |
| 4 | `role_permissions` | Bảng liên kết role ↔ permission | → roles, permissions |
| 5 | `categories` | Danh mục khóa học | — |
| 6 | `courses` | Khóa học | → categories, users (instructor) |
| 7 | `lessons` | Bài giảng (video_url, content, docx_url) | → courses |
| 8 | `enrollments` | Ghi danh | → users, courses |
| 9 | `orders` | Đơn hàng | → users, courses |
| 10 | `reviews` | Đánh giá | → users, courses |
| 11 | `favorites` | Yêu thích | → users, courses |
| 12 | `lesson_progress` | Tiến độ bài học | → users, lessons |
| 13 | `lesson_comments` | Bình luận bài học | → users, lessons |
| 14 | `chat_messages` | Tin nhắn chatbot | → users |
| 15 | `coupons` | Mã giảm giá | — |
| 16 | `quiz_results` | Kết quả quiz | → users, lessons |

---

## 🔄 LUỒNG XỬ LÝ QUAN TRỌNG

### Thanh toán → Tự động ghi danh
```
1. User checkout      → POST /api/orders (status = PENDING)
2. User chuyển khoản  → VietQR
3. Admin duyệt        → PUT /api/orders (status = PAID)
4. Backend tự động     → INSERT INTO enrollments (AUTO ENROLL ✅)
5. User truy cập học   → GET /api/courses/:id (isEnrolled = true)
```

### Toggle yêu thích
```
1. User click ❤️    → POST /api/favorites {courseId}
2. Backend kiểm tra  → SELECT FROM favorites WHERE user_id AND course_id
3. Nếu đã có         → DELETE (bỏ yêu thích)
4. Nếu chưa có       → INSERT (thêm yêu thích)
5. Response          → {favorited: true/false}
```

---

## 🔑 CÁCH NHẬN BIẾT FILE BACKEND

```
✅ Nằm trong thư mục app/api/
✅ Export: GET, POST, PUT, DELETE (NextResponse)
✅ Import: db from '@/lib/db', getAuthUser from '@/lib/auth'
✅ Sử dụng: db.execute<RowDataPacket[]>(SQL, params)
✅ Không có JSX, không có 'use client'
✅ Xử lý request/response HTTP
```

---

## 📋 CẤU HÌNH

| File | Mô tả |
|------|-------|
| `.env` | Biến môi trường (DB_HOST, JWT_SECRET, GEMINI_API_KEY...) |
| `next.config.ts` | Cấu hình Next.js |
| `tsconfig.json` | Cấu hình TypeScript |
| `package.json` | Dependencies & scripts |
