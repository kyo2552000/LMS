
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, PoolConnection } from "mysql2/promise";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";
import { z } from "zod";
import { validateInput } from "@/lib/validation";
import {
    handleApiError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ErrorCodes,
} from "@/lib/api-error";

const CreateReviewSchema = z.object({
    courseId: z.string().min(1, "courseId là bắt buộc"),
    rating:   z.number().int().min(1, "Tối thiểu 1 sao").max(5, "Tối đa 5 sao"),
    comment:  z.string().max(2000, "Nhận xét tối đa 2000 ký tự").optional(),
});

// ─── GET: lấy reviews của 1 course ───────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("courseId");
        if (!courseId) return NextResponse.json({ error: "Thiếu courseId" }, { status: 400 });

        const [reviews] = await db.execute<RowDataPacket[]>(
            `SELECT r.id, r.rating, r.comment, r.created_at,
                    u.id as user_id, u.name as user_name, u.avatar as user_avatar
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.course_id = ?
             ORDER BY r.created_at DESC`,
            [courseId]
        );

        // Tổng hợp stats — ported từ YoloHub's averageRating aggregation
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum: number, r: RowDataPacket) => sum + r.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({
            reviews,
            stats: {
                total: reviews.length,
                average: Math.round(avgRating * 10) / 10,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─── POST: tạo / cập nhật review ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
    let connection: PoolConnection | null = null;
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        // Zod validation
        const body = await request.json().catch(() => ({}));
        const validation = validateInput(CreateReviewSchema, body);
        if (!validation.success) return validation.response;
        const { courseId, rating, comment } = validation.data;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Kiểm tra đã enroll chưa
        const [enrollments] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
            [user.id, courseId]
        );
        if (enrollments.length === 0) {
            throw new AuthorizationError(
                "Bạn phải đăng ký khóa học này mới có thể đánh giá",
                ErrorCodes.NOT_ENROLLED
            );
        }

        // Kiểm tra course tồn tại
        const [courses] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM courses WHERE id = ?",
            [courseId]
        );
        if (courses.length === 0) throw new NotFoundError("Không tìm thấy khóa học", ErrorCodes.COURSE_NOT_FOUND);

        // Upsert review
        const [existing] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM reviews WHERE user_id = ? AND course_id = ?",
            [user.id, courseId]
        );

        if (existing.length > 0) {
            await connection.execute(
                "UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE user_id = ? AND course_id = ?",
                [rating, comment || "", user.id, courseId]
            );
        } else {
            await connection.execute(
                "INSERT INTO reviews (id, rating, comment, user_id, course_id) VALUES (?, ?, ?, ?, ?)",
                [crypto.randomUUID(), rating, comment || "", user.id, courseId]
            );
        }

        // Cập nhật average rating của course — atomic trong cùng transaction
        await connection.execute(
            `UPDATE courses
             SET rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE course_id = ?)
             WHERE id = ?`,
            [courseId, courseId]
        );

        await connection.commit();
        return NextResponse.json({ success: true, message: existing.length > 0 ? "Cập nhật đánh giá thành công" : "Đánh giá thành công" });

    } catch (error) {
        if (connection) await connection.rollback();
        return handleApiError(error);
    } finally {
        if (connection) connection.release();
    }
}
