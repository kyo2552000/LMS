
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";
import { z } from "zod";
import { validateInput } from "@/lib/validation";
import {
    handleApiError,
    AuthenticationError,
    ErrorCodes,
} from "@/lib/api-error";

const ToggleFavoriteSchema = z.object({
    courseId: z.string().min(1, "courseId là bắt buộc"),
});

// ─── GET: danh sách favorites ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        const { searchParams } = new URL(request.url);
        const stats = searchParams.get("stats");

        // Admin: top favorited courses
        if (stats === "top" && user.role === "ADMIN") {
            const [rows] = await db.execute<RowDataPacket[]>(`
                SELECT c.id, c.title, c.image, c.price, c.type, c.rating, c.students,
                       cat.name as category_name,
                       COUNT(f.id) as favorite_count
                FROM favorites f
                JOIN courses c   ON f.course_id = c.id
                JOIN categories cat ON c.category_id = cat.id
                GROUP BY c.id
                ORDER BY favorite_count DESC
                LIMIT 10
            `);
            return NextResponse.json({ topFavorites: rows });
        }

        // User favorites với thông tin course đầy đủ
        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT f.id as favorite_id, f.created_at as favorited_at,
                    c.id as course_id, c.title, c.image, c.price, c.type, c.rating, c.level,
                    cat.name as category_name
             FROM favorites f
             JOIN courses c      ON f.course_id    = c.id
             JOIN categories cat ON c.category_id  = cat.id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
            [user.id]
        );

        return NextResponse.json({ favorites: rows, total: rows.length });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─── POST: toggle favorite ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        const body = await request.json().catch(() => ({}));
        const validation = validateInput(ToggleFavoriteSchema, body);
        if (!validation.success) return validation.response;
        const { courseId } = validation.data;

        const [existing] = await db.execute<RowDataPacket[]>(
            "SELECT id FROM favorites WHERE user_id = ? AND course_id = ?",
            [user.id, courseId]
        );

        if (existing.length > 0) {
            await db.execute<ResultSetHeader>(
                "DELETE FROM favorites WHERE user_id = ? AND course_id = ?",
                [user.id, courseId]
            );
            return NextResponse.json({ favorited: false, message: "Đã bỏ yêu thích" });
        } else {
            await db.execute<ResultSetHeader>(
                "INSERT INTO favorites (id, user_id, course_id) VALUES (?, ?, ?)",
                [crypto.randomUUID(), user.id, courseId]
            );
            return NextResponse.json({ favorited: true, message: "Đã thêm yêu thích" }, { status: 201 });
        }
    } catch (error) {
        return handleApiError(error);
    }
}
