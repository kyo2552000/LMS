/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function setup() {
    // Step 1: Connect and create database
    console.log(" Connecting to MySQL...");
    const conn = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "123456",
        multipleStatements: true,
    });

    // Step 2: Run init SQL (creates DB + tables)
    console.log(" Creating database and tables...");
    const initSQL = fs.readFileSync(path.join(__dirname, "init.sql"), "utf-8");
    await conn.query(initSQL);
    console.log("✅ Database 'edulearn' and all tables ready\n");
    await conn.end();

    // Step 3: Seed data (connects separately)
    require("./seed.js");
}

setup().catch((err) => {
    console.error(" Setup failed:", err.message);
    process.exit(1);
});
