// Migration: Add docx_url column to lessons table
// Run: node sql/migrate-docx-url.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edulearn',
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    try {
        console.log('🔄 Checking if docx_url column exists...');
        
        const [rows] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'lessons' 
              AND COLUMN_NAME = 'docx_url'
        `);

        if (rows.length > 0) {
            console.log('✅ Column docx_url already exists. No migration needed.');
        } else {
            await connection.execute(`
                ALTER TABLE lessons 
                ADD COLUMN docx_url VARCHAR(500) NULL 
                AFTER video_url;
            `);
            console.log('✅ Successfully added docx_url column to lessons table!');
        }
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrate();
