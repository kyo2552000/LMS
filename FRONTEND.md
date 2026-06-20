# 🎨 FRONTEND — Giao diện người dùng (Client-side)

> Tất cả file dưới đây chạy trên **trình duyệt**, sử dụng React để render giao diện.
> Nhận diện: có `'use client'`, sử dụng `useState`, `useEffect`, JSX.

---

## 📄 TRANG NGƯỜI DÙNG (User Pages)

| STT | Đường dẫn file | URL truy cập | Mô tả |
|-----|---------------|--------------|-------|
| 1 | `app/page.tsx` | `/` | Trang chủ |
| 2 | `app/courses/page.tsx` | `/courses` | Danh sách khóa học + Bộ lọc (danh mục, cấp độ, giá) |
| 3 | `app/courses/[id]/page.tsx` | `/courses/:id` | Chi tiết khóa học |
| 4 | `app/courses/[id]/learn/page.tsx` | `/courses/:id/learn` | Trang học (Video + Quiz + DOCX + Comments) |
| 5 | `app/courses/[id]/certificate/page.tsx` | `/courses/:id/certificate` | Chứng chỉ hoàn thành |
| 6 | `app/checkout/page.tsx` | `/checkout` | Thanh toán VietQR |
| 7 | `app/cart/page.tsx` | `/cart` | Giỏ hàng |
| 8 | `app/orders/page.tsx` | `/orders` | Lịch sử đơn hàng |
| 9 | `app/login/page.tsx` | `/login` | Đăng nhập |
| 10 | `app/register/page.tsx` | `/register` | Đăng ký tài khoản |
| 11 | `app/profile/page.tsx` | `/profile` | Hồ sơ cá nhân |
| 12 | `app/dashboard/page.tsx` | `/dashboard` | Dashboard học viên |
| 13 | `app/settings/page.tsx` | `/settings` | Cài đặt tài khoản |
| 14 | `app/about/page.tsx` | `/about` | Giới thiệu |
| 15 | `app/contact/page.tsx` | `/contact` | Liên hệ |

---

## 📄 TRANG QUẢN TRỊ (Admin Pages)

| STT | Đường dẫn file | URL truy cập | Mô tả |
|-----|---------------|--------------|-------|
| 1 | `app/admin/page.tsx` | `/admin` | Dashboard thống kê (Revenue, Favorites, Charts) |
| 2 | `app/admin/layout.tsx` | — | Layout admin (Sidebar + Kiểm tra quyền) |
| 3 | `app/admin/courses/page.tsx` | `/admin/courses` | Quản lý khóa học (Thêm/Sửa/Xóa) |
| 4 | `app/admin/courses/[id]/lessons/page.tsx` | `/admin/courses/:id/lessons` | Quản lý bài giảng |
| 5 | `app/admin/users/page.tsx` | `/admin/users` | Quản lý người dùng |
| 6 | `app/admin/categories/page.tsx` | `/admin/categories` | Quản lý danh mục |
| 7 | `app/admin/orders/page.tsx` | `/admin/orders` | Quản lý đơn hàng (Duyệt thanh toán → Auto enroll) |
| 8 | `app/admin/enrollments/page.tsx` | `/admin/enrollments` | Quản lý ghi danh |
| 9 | `app/admin/reviews/page.tsx` | `/admin/reviews` | Quản lý đánh giá |
| 10 | `app/admin/coupons/page.tsx` | `/admin/coupons` | Quản lý mã giảm giá |
| 11 | `app/admin/roles/page.tsx` | `/admin/roles` | Quản lý vai trò & quyền |
| 12 | `app/admin/comments/page.tsx` | `/admin/comments` | Quản lý bình luận |
| 13 | `app/admin/chat/page.tsx` | `/admin/chat` | Quản lý tin nhắn |
| 14 | `app/admin/files/page.tsx` | `/admin/files` | Quản lý tệp |

---

## 🧩 COMPONENTS (Thành phần UI tái sử dụng)

| STT | File | Chức năng |
|-----|------|-----------|
| 1 | `components/Navbar.tsx` | Thanh điều hướng chính (search, cart, user menu) |
| 2 | `components/Footer.tsx` | Chân trang |
| 3 | `components/HeroSection.tsx` | Banner trang chủ với animation |
| 4 | `components/CourseCard.tsx` | Thẻ khóa học (hiển thị ảnh, giá, rating, nút ❤️) |
| 5 | `components/CourseReviews.tsx` | Đánh giá & chấm sao khóa học |
| 6 | `components/LessonComments.tsx` | Bình luận bài học |
| 7 | `components/ChatBot.tsx` | AI Chatbot (Google Gemini) |
| 8 | `components/AdminTable.tsx` | Bảng dữ liệu CRUD tổng quát cho admin |
| 9 | `components/AuthProvider.tsx` | Context provider quản lý đăng nhập |
| 10 | `components/Pagination.tsx` | Phân trang |
| 11 | `components/QuizBuilder.tsx` | Tạo quiz cho admin |
| 12 | `components/TakeQuiz.tsx` | Làm quiz cho học viên |
| 13 | `components/ui/*` | UI primitives: Button, Card, Tabs, Input... |

---

## 🎨 STYLING & LAYOUT

| File | Mô tả |
|------|-------|
| `app/globals.css` | CSS toàn cục (Tailwind CSS config) |
| `app/layout.tsx` | Layout gốc (Navbar + Footer + AuthProvider) |
| `tailwind.config.ts` | Cấu hình Tailwind CSS |

---

## 📦 FRONTEND UTILITIES (Hàm hỗ trợ phía client)

| File | Chức năng |
|------|-----------|
| `lib/cart.ts` | Quản lý giỏ hàng dùng localStorage |
| `lib/mock-data.ts` | Dữ liệu mẫu hiển thị trang chủ |
| `lib/utils.ts` | Hàm tiện ích (cn - class merge) |
| `types/index.ts` | TypeScript types & interfaces |

---

## 🔑 CÁCH NHẬN BIẾT FILE FRONTEND

```
✅ Có 'use client' ở dòng đầu
✅ Import: useState, useEffect, useRouter, Link, Image
✅ Trả về JSX (<div>, <button>, <Card>...)
✅ Không import trực tiếp db hoặc mysql2
✅ Giao tiếp backend qua: fetch('/api/...')
```
