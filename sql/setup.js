/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Khởi tạo DB: chạy init.sql (DROP/CREATE tables) rồi seed dữ liệu.
 * Dùng cùng biến môi trường với ứng dụng (.env.local / .env).
 */
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const { getMysqlOptions } = require("./db-config");
const { seed } = require("./seed");

async function setup() {
    console.log("🔌 Connecting to MySQL...");
    const conn = await mysql.createConnection(getMysqlOptions({ withDatabase: false }));

    console.log("📦 Creating database and tables (init.sql)...");
    const initSQL = fs.readFileSync(path.join(__dirname, "init.sql"), "utf-8");
    await conn.query(initSQL);
    console.log(`✅ Database ready (see init.sql)`);
    await conn.end();

    console.log("");
    await seed();
}

setup().catch((err) => {
    console.error("❌ Setup failed:", err.message);
    process.exit(1);
});
