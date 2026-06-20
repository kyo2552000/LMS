# Sơ đồ lớp (Class Diagram) - Hệ thống EDULearn

Tài liệu này mô tả cấu trúc các lớp và mối quan hệ giữa chúng trong hệ thống EDULearn, tập trung vào việc quản lý khóa học, ghi danh và theo dõi tiến độ học tập.

## 1. Biểu đồ Mermaid

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        +String avatar
        +Enum role
        +String status
        +String bio
        +DateTime created_at
    }

    class Course {
        +String id
        +String title
        +String slug
        +String description
        +Decimal price
        +String image
        +Decimal rating
        +Integer students
        +Enum level
        +Enum type
        +Boolean published
        +DateTime created_at
    }

    class Category {
        +String id
        +String name
        +String slug
        +String icon
        +String color
        +Integer course_count
    }

    class Lesson {
        +String id
        +String title
        +Enum type
        +String duration
        +String content
        +String video_url
        +String docx_url
        +Integer sort_order
    }

    class Enrollment {
        +String id
        +Enum status
        +Decimal progress
        +DateTime enrolled_at
        +DateTime completed_at
    }

    class LessonProgress {
        +String id
        +Boolean completed
        +DateTime completed_at
        +Integer watch_time
        +Decimal watch_percent
        +Integer last_position
    }

    class Review {
        +String id
        +Integer rating
        +String comment
        +DateTime created_at
    }

    class Order {
        +String id
        +Decimal amount
        +Decimal discount_amount
        +Enum status
        +String payment_method
        +DateTime created_at
        +DateTime paid_at
    }

    %% Relationships
    User "1" -- "*" Course : Giảng dạy (Instructor)
    Category "1" -- "*" Course : Thuộc danh mục
    Course "1" -- "*" Lesson : Bao gồm các bài học
    
    User "1" -- "*" Enrollment : Ghi danh học
    Course "1" -- "*" Enrollment : Được ghi danh
    
    User "1" -- "*" LessonProgress : Theo dõi tiến độ
    Lesson "1" -- "*" LessonProgress : Có tiến độ học tập
    
    User "1" -- "*" Review : Viết đánh giá
    Course "1" -- "*" Review : Được đánh giá
    
    User "1" -- "*" Order : Đặt hàng
    Course "1" -- "*" Order : Trong đơn hàng
```

## 2. Giải thích chi tiết các quan hệ chính

### 2.1. Quan hệ Ghi danh (Enrollment)
Đây là quan hệ **Nhiều - Nhiều** giữa `User` (Học viên) và `Course` (Khóa học), được cụ thể hóa qua lớp trung gian `Enrollment`.
*   Mỗi bản ghi `Enrollment` thể hiện việc một học viên đã đăng ký một khóa học.
*   Trường `status` lưu trạng thái (Đang học, Hoàn thành, Tạm dừng).
*   Trường `progress` (0-100%) thể hiện tổng tiến độ hoàn thành khóa học của học viên đó.

### 2.2. Quan hệ Tiến độ bài học (Lesson Progress)
Đây là quan hệ chi tiết hơn để theo dõi việc học của từng bài giảng, là quan hệ **Nhiều - Nhiều** giữa `User` và `Lesson`.
*   Giúp hệ thống biết học viên đã xem bài giảng đến đâu (`last_position`), xem được bao nhiêu phần trăm (`watch_percent`).
*   Khi tất cả `LessonProgress` của các bài học trong một khóa học được đánh dấu `completed = true`, hệ thống sẽ cập nhật `Enrollment.status = 'COMPLETED'`.

### 2.3. Quan hệ Giảng viên (Instructor)
*   Một `User` có vai trò `INSTRUCTOR` có thể tạo và quản lý nhiều `Course`. Đây là quan hệ **1 - Nhiều**.

### 2.4. Quan hệ Danh mục (Category)
*   Các khóa học được phân loại theo `Category` để người dùng dễ dàng tìm kiếm. Một danh mục có thể chứa nhiều khóa học (**1 - Nhiều**).
