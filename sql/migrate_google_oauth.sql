-- Thêm cột google_id vào bảng users để lưu Google OAuth ID
-- Chạy câu lệnh SQL này 1 lần trong database của bạn

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL DEFAULT '';

-- Tạo index để tìm kiếm nhanh theo google_id
ALTER TABLE users ADD INDEX idx_google_id (google_id);
