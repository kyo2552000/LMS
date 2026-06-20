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

    // Check and add watch_percent column
    const [cols1] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lesson_progress' AND COLUMN_NAME = 'watch_percent'`
    );
    if (cols1[0].cnt === 0) {
        await conn.execute('ALTER TABLE lesson_progress ADD COLUMN watch_percent DECIMAL(5,2) DEFAULT 0 AFTER watch_time');
        console.log('✅ Added column: watch_percent');
    } else {
        console.log('⏭️  Column watch_percent already exists.');
    }

    // Check and add last_position column
    const [cols2] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lesson_progress' AND COLUMN_NAME = 'last_position'`
    );
    if (cols2[0].cnt === 0) {
        await conn.execute('ALTER TABLE lesson_progress ADD COLUMN last_position INT DEFAULT 0 AFTER watch_percent');
        console.log('✅ Added column: last_position');
    } else {
        console.log('⏭️  Column last_position already exists.');
    }

    // Set defaults for null values
    await conn.execute('UPDATE lesson_progress SET watch_percent = COALESCE(watch_percent, 0), last_position = COALESCE(last_position, 0)');
    console.log('✅ Migration complete!');

    await conn.end();
}

run().catch(err => { console.error('❌ Migration failed:', err.message); process.exit(1); });
