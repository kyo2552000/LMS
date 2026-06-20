import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, PoolConnection } from "mysql2/promise";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import { validateInput } from "@/lib/validation";
import {
    handleApiError,
    AuthenticationError,
    NotFoundError,
    ErrorCodes,
} from "@/lib/api-error";

const MarkProgressSchema = z.object({
    lessonId: z.string().min(1, "lessonId là bắt buộc"),
    completed: z.boolean(),
    watchTime: z.number().int().min(0).optional(),
    watchPercent: z.number().min(0).max(100).optional(),
    lastPosition: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
    let connection: PoolConnection | null = null;
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        const body = await request.json().catch(() => ({}));
        const validation = validateInput(MarkProgressSchema, body);
        if (!validation.success) return validation.response;
        const { lessonId, completed, watchTime = 0, watchPercent = 0, lastPosition = 0 } = validation.data;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [lessonRows] = await connection.execute<RowDataPacket[]>(
            "SELECT course_id FROM lessons WHERE id = ?",
            [lessonId]
        );
        if (lessonRows.length === 0) throw new NotFoundError("Không tìm thấy bài học", ErrorCodes.LESSON_NOT_FOUND);
        const { course_id: courseId } = lessonRows[0];

        if (completed) {
            await connection.execute(
                `INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at, watch_time, watch_percent, last_position)
                 VALUES (UUID(), ?, ?, TRUE, NOW(), ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    completed = TRUE,
                    completed_at = NOW(),
                    watch_time = GREATEST(watch_time, VALUES(watch_time)),
                    watch_percent = GREATEST(watch_percent, VALUES(watch_percent)),
                    last_position = GREATEST(last_position, VALUES(last_position))`,
                [user.id, lessonId, watchTime, watchPercent, lastPosition]
            );
        } else {
            await connection.execute(
                `INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at, watch_time, watch_percent, last_position)
                 VALUES (UUID(), ?, ?, FALSE, NULL, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    watch_time = GREATEST(watch_time, VALUES(watch_time)),
                    watch_percent = GREATEST(watch_percent, VALUES(watch_percent)),
                    last_position = GREATEST(last_position, VALUES(last_position))`,
                [user.id, lessonId, watchTime, watchPercent, lastPosition]
            );
        }

        const [progressRows] = await connection.execute<RowDataPacket[]>(
            `SELECT
                (SELECT COUNT(*) FROM lessons WHERE course_id = ?) AS total,
                (SELECT COUNT(*) FROM lesson_progress lp
                    JOIN lessons l ON l.id = lp.lesson_id
                    WHERE lp.user_id = ? AND l.course_id = ? AND lp.completed = TRUE) AS completed_count`,
            [courseId, user.id, courseId]
        );

        const { total, completed_count } = progressRows[0];
        const progress = total > 0 ? Math.round((completed_count / total) * 100) : 0;
        const isFinished = total > 0 && completed_count === total;

        await connection.execute(
            `UPDATE enrollments
             SET progress = ?,
                 status = ?,
                 completed_at = IF(?, NOW(), NULL)
             WHERE user_id = ? AND course_id = ?`,
            [progress, isFinished ? "COMPLETED" : "ACTIVE", isFinished, user.id, courseId]
        );

        if (isFinished) {
            await connection.execute(
                "INSERT IGNORE INTO notifications (id, user_id, title, message, type, href, entity_id) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
                [
                    user.id, 
                    "Chúc mừng hoàn thành khóa học!", 
                    "Bạn đã hoàn thành 100% nội dung. Chứng chỉ đã sẵn sàng!", 
                    "CERTIFICATE", 
                    `/courses/${courseId}/certificate`, 
                    courseId
                ]
            );
        }

        await connection.commit();
        return NextResponse.json({ success: true, progress, isCompleted: isFinished });

    } catch (error) {
        if (connection) await connection.rollback();
        return handleApiError(error);
    } finally {
        if (connection) connection.release();
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("courseId");
        if (!courseId) return NextResponse.json({ error: "courseId là bắt buộc" }, { status: 400 });

        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT lp.lesson_id, lp.completed_at, lp.watch_time, lp.watch_percent, lp.last_position
             FROM lesson_progress lp
             JOIN lessons l ON l.id = lp.lesson_id
             WHERE lp.user_id = ? AND l.course_id = ?`,
            [user.id, courseId]
        );

        return NextResponse.json({
            completedIds: rows.filter((r) => r.completed_at).map((r) => r.lesson_id),
            completedCount: rows.filter((r) => r.completed_at).length,
            progressMap: Object.fromEntries(rows.map((r) => [r.lesson_id, {
                watchTime: r.watch_time || 0,
                watchPercent: Number(r.watch_percent || 0),
                lastPosition: r.last_position || 0,
                completed: Boolean(r.completed_at),
            }])),
        });
    } catch (error) {
        return handleApiError(error);
    }
}
