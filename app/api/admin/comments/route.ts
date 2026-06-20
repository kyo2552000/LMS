import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/comments
export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
        conditions.push("(cm.content LIKE ? OR u.name LIKE ? OR co.title LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
        conditions.push("cm.status = ?");
        params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT cm.*, u.name as user_name, u.avatar as user_avatar, co.title as course_title
         FROM comments cm
         JOIN users u ON u.id = cm.user_id
         JOIN courses co ON co.id = cm.course_id
         ${where}
         ORDER BY cm.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, String(limit), String(offset)]
    );

    const [total] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM comments cm
         JOIN users u ON u.id = cm.user_id
         JOIN courses co ON co.id = cm.course_id
         ${where}`,
        params
    );

    return NextResponse.json({ rows, total: (total[0] as RowDataPacket).cnt });
}

// PUT /api/admin/comments - update status
export async function PUT(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) {
        return NextResponse.json({ error: "ID và trạng thái là bắt buộc" }, { status: 400 });
    }

    await db.execute("UPDATE comments SET status=? WHERE id=?", [status, id]);
    return NextResponse.json({ message: "Cập nhật trạng thái thành công" });
}

// DELETE /api/admin/comments
export async function DELETE(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });

    await db.execute("DELETE FROM comments WHERE id=?", [id]);
    return NextResponse.json({ message: "Xóa bình luận thành công" });
}
