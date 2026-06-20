const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        database: process.env.DB_NAME || 'edulearn',
    });

    console.log('Connected to database.');

    await conn.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            href VARCHAR(500) NULL,
            entity_id VARCHAR(36) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_notifications_user (user_id)
        )
    `);

    // Ensure columns exist (for existing tables)
    try {
        await conn.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS href VARCHAR(500) NULL");
        await conn.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id VARCHAR(36) NULL");
    } catch (e) {
        // ignore if already exists or syntax not supported
    }

    console.log('✅ Created table: notifications');
    await conn.end();
}

run().catch(err => { console.error('❌ Migration failed:', err.message); process.exit(1); });
