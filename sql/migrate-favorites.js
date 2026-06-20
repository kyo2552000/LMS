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

    console.log("🔄 Running migration: Add favorites table...\n");

    try {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS favorites (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                course_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_favorite (user_id, course_id),
                INDEX idx_favorites_user (user_id),
                INDEX idx_favorites_course (course_id)
            )
        `);
        console.log("✅ Favorites table created/verified");
    } catch (err) {
        console.log("ℹ️ Favorites table may already exist:", err.message);
    }

    console.log("\n🎉 Migration completed!");
    await connection.end();
}

migrate().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
