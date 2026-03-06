/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Reset password script - use when you forget admin/user password
 * 
 * Usage:
 *   node sql/reset-password.js admin@edulearn.com newpassword123
 *   node sql/reset-password.js student@edulearn.com mypass456
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function resetPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
        console.log(" Usage: node sql/reset-password.js <email> <new-password>");
        console.log(" Example: node sql/reset-password.js admin@edulearn.com admin123");
        process.exit(1);
    }

    if (newPassword.length < 6) {
        console.log(" Password must be at least 6 characters");
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "123456",
        database: "edulearn",
    });

    try {
        // Check if user exists
        const [users] = await connection.execute(
            "SELECT id, email, name, role FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            console.log(` User not found: ${email}`);
            console.log(" Available users:");
            const [allUsers] = await connection.execute("SELECT email, name, role FROM users");
            allUsers.forEach((u) => console.log(` ${u.email} (${u.name} - ${u.role})`));
            process.exit(1);
        }

        const user = users[0];

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.execute("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);

        console.log(` Password reset successfully!`);
        console.log(` User: ${user.name} (${user.email})`);
        console.log(` Role: ${user.role}`);
        console.log(` New password: ${newPassword}`);
    } finally {
        await connection.end();
    }
}

resetPassword().catch((err) => {
    console.error(" Error:", err.message);
    process.exit(1);
});
