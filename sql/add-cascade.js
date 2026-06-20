/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise");

async function addCascade() {
    console.log("Connecting to MySQL to update foreign keys with ON DELETE CASCADE...");
    const conn = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "123456",
        database: "edulearn",
    });

    try {
        // Find foreign keys that reference `users` or `courses`
        const [fks] = await conn.execute(`
            SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_SCHEMA = 'edulearn' AND REFERENCED_TABLE_NAME IN ('users', 'courses')
        `);

        for (const fk of fks) {
            console.log(`Dropping and re-adding FK for ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            
            // Drop existing FK
            await conn.execute(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            
            // Add new FK with ON DELETE CASCADE
            // But wait! If it was ON DELETE SET NULL, do we keep it? 
            // In init.sql, most were NO ACTION (default). We want to cascade.
            let onDeleteRule = 'CASCADE';
            // Exception: users.role_id -> roles(id) ON DELETE SET NULL (but we are filtering by REFERENCED_TABLE_NAME in users, courses so it's fine)
            // Exception: coupons.created_by -> users(id) ON DELETE SET NULL
            if (fk.TABLE_NAME === 'coupons' && fk.COLUMN_NAME === 'created_by') {
                onDeleteRule = 'SET NULL';
            }

            await conn.execute(`
                ALTER TABLE \`${fk.TABLE_NAME}\`
                ADD CONSTRAINT \`${fk.CONSTRAINT_NAME}\`
                FOREIGN KEY (\`${fk.COLUMN_NAME}\`) REFERENCES \`${fk.REFERENCED_TABLE_NAME}\` (\`${fk.REFERENCED_COLUMN_NAME}\`)
                ON DELETE ${onDeleteRule}
            `);
            console.log(`✅ Updated ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} to ON DELETE ${onDeleteRule}`);
        }

        console.log("All foreign keys updated successfully!");
    } catch (err) {
        console.error("Failed to update foreign keys:", err);
    } finally {
        await conn.end();
    }
}

addCascade();
