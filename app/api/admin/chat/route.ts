import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/lib/auth";

// GET: list chat messages with user info
export async function GET(request: NextRequest) {
    try {
        const admin = await getAuthUser();
        if (!admin || admin.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "30");
        const offset = (page - 1) * limit;

        const [messages] = await db.execute<RowDataPacket[]>(
            `SELECT cm.*, u.name as user_name, u.email as user_email
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       ORDER BY cm.created_at DESC
       LIMIT ? OFFSET ?`,
            [String(limit), String(offset)]
        );

        const [countResult] = await db.execute<RowDataPacket[]>(
            "SELECT COUNT(*) as total FROM chat_messages"
        );
        const total = countResult[0]?.total || 0;

        return NextResponse.json({ messages, total, page, limit });
    } catch (error) {
        console.error("Admin chat error:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

// DELETE: delete a message or all messages from a user
export async function DELETE(request: NextRequest) {
    try {
        const admin = await getAuthUser();
        if (!admin || admin.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id, userId } = await request.json();

        if (userId) {
            // Delete all messages from a user
            const [result] = await db.execute<ResultSetHeader>(
                "DELETE FROM chat_messages WHERE user_id = ?",
                [userId]
            );
            return NextResponse.json({ affectedRows: result.affectedRows });
        }

        if (id) {
            // Delete single message
            const [result] = await db.execute<ResultSetHeader>(
                "DELETE FROM chat_messages WHERE id = ?",
                [id]
            );
            return NextResponse.json({ affectedRows: result.affectedRows });
        }

        return NextResponse.json({ error: "ID or userId required" }, { status: 400 });
    } catch (error) {
        console.error("Delete chat error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
