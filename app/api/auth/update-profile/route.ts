import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser, signToken } from "@/lib/auth";

export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await request.json();

        // Get user from DB
        const [users] = await db.execute<RowDataPacket[]>(
            "SELECT * FROM users WHERE id = ?",
            [user.id]
        );

        if (users.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update user in DB
        await db.execute("UPDATE users SET name = ? WHERE id = ?", [
            name.trim(),
            user.id,
        ]);

        // Get updated user data
        const dbUser = users[0];
        
        // Create new JWT token
        const newToken = signToken({
            id: dbUser.id,
            email: dbUser.email,
            name: name.trim(),
            role: dbUser.role,
            avatar: dbUser.avatar,
        });

        // Set cookie
        const response = NextResponse.json({
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: name.trim(),
                role: dbUser.role,
                avatar: dbUser.avatar,
            },
            message: "Cập nhật thông tin thành công"
        });

        response.cookies.set("auth_token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
