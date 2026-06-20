/**
 * Cấu hình MySQL cho các script trong thư mục sql/ (seed, setup, reset-password).
 * Đọc biến môi trường giống app Next.js (lib/db.ts). Ưu tiên .env.local rồi .env.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const fs = require("fs");

function loadEnvFiles() {
    const root = path.join(__dirname, "..");
    for (const name of [".env.local", ".env"]) {
        const p = path.join(root, name);
        if (!fs.existsSync(p)) continue;
        const text = fs.readFileSync(p, "utf8");
        for (const line of text.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eq = trimmed.indexOf("=");
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) process.env[key] = val;
        }
    }
}

loadEnvFiles();

function getMysqlOptions({ withDatabase } = { withDatabase: true }) {
    const opts = {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306", 10),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "123456",
        multipleStatements: true,
        ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2" } : undefined,
    };
    if (withDatabase !== false) {
        opts.database = process.env.DB_NAME || "edulearn";
    }
    return opts;
}

module.exports = {
    loadEnvFiles,
    getMysqlOptions,
    /** Tên DB dùng trong init.sql / kết nối app */
    getDatabaseName: () => process.env.DB_NAME || "edulearn",
};
