Cách dùng trên máy mới
Cài MySQL, tạo user/password (hoặc dùng root).
Copy repo, chạy npm install.
Sao chép .env.example → .env.local, chỉnh DB_* đúng máy đó (và DB_NAME=edulearn trùng với sql/init.sql hoặc tự đổi cả hai cho khớp).
npm run db:setup — tạo bảng + seed.
Hoặc: npm run db:init rồi npm run db:seed
(db:seed sẽ TRUNCATE và nạp lại dữ liệu mẫu; không chỉnh schema.)