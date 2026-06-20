import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, AuthenticationError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập");

        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT 
                id, 
                type, 
                title, 
                message as body, 
                href,
                entity_id,
                is_read as \`read\`, 
                created_at 
            FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50`,
            [user.id]
        );

        // Convert 0/1 to boolean for read
        const notifications = rows.map(r => ({
            ...r,
            read: !!r.read
        }));

        return NextResponse.json({ notifications });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập");

        const { searchParams } = new URL(request.url);
        let id = searchParams.get("id");

        if (!id) {
            const body = await request.json().catch(() => ({}));
            id = body.id;
        }
        
        if (id) {
            await db.execute(
                "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
                [id, user.id]
            );
        } else {
            await db.execute(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
                [user.id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
