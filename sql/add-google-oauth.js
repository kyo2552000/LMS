/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise");

async function migrate() {
    const connection = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "123456",
        database: "edulearn",
    });

    console.log("🔌 Đã kết nối MySQL. Đang chạy migration Google OAuth...\n");

    try {
        // Kiểm tra xem cột google_id đã tồn tại chưa
        const [cols] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'edulearn' 
              AND TABLE_NAME = 'users' 
              AND COLUMN_NAME = 'google_id'
        `);

        if (cols.length > 0) {
            console.log("ℹ️  Cột google_id đã tồn tại. Bỏ qua migration.");
        } else {
            // Thêm cột google_id vào bảng users
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN google_id VARCHAR(255) NULL DEFAULT NULL
            `);
            console.log("✅ Đã thêm cột google_id vào bảng users.");

            // Thêm index để tìm kiếm nhanh
            await connection.execute(`
                ALTER TABLE users 
                ADD INDEX idx_google_id (google_id)
            `);
            console.log("✅ Đã tạo index cho google_id.");
        }

        // Cho phép cột password để trống (dành cho tài khoản Google)
        await connection.execute(`
            ALTER TABLE users 
            MODIFY COLUMN password VARCHAR(255) NOT NULL DEFAULT ''
        `);
        console.log("✅ Đã cập nhật cột password (cho phép rỗng với Google accounts).");

        console.log("\n🎉 Migration hoàn thành! Tính năng đăng nhập Google đã sẵn sàng.");
        console.log("📝 Tiếp theo: Thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file .env");

    } catch (err) {
        console.error("❌ Lỗi migration:", err.message);
        throw err;
    } finally {
        await connection.end();
    }
}

migrate().catch((err) => {
    console.error("❌ Migration thất bại:", err.message);
    process.exit(1);
});
