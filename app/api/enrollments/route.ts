/**
 * POST /api/enrollments
 * ✅ Upgraded with:
 *   - Database Transaction (INSERT enrollment + UPDATE students atomic) — ported từ YoloHub
 *   - Zod validation — từ YoloHub's validateBody
 *   - Custom Error classes — từ YoloHub's error handling pattern
 *   - Centralized error handling
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, PoolConnection } from "mysql2/promise";
import { getAuthUser } from "@/lib/auth";
import { validateInput, EnrollmentSchema } from "@/lib/validation";
import {
    handleApiError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    ConflictError,
    ErrorCodes,
} from "@/lib/api-error";

// POST /api/enrollments — Tự enroll khóa học FREE (không cần thanh toán)
export async function POST(request: NextRequest) {
    // ① Auth check
    const user = await getAuthUser();
    if (!user) {
        return handleApiError(
            new AuthenticationError("Vui lòng đăng nhập để đăng ký khóa học", ErrorCodes.TOKEN_INVALID)
        );
    }

    // ② Zod Validation
    const body = await request.json().catch(() => ({}));
    const validation = validateInput(EnrollmentSchema, body);
    if (!validation.success) return validation.response;
    const { courseId } = validation.data;

    // ③ Transaction — ported from YoloHub pattern (atomic multi-step operation)
    // Đảm bảo INSERT enrollment và UPDATE students count là 1 atomic operation
    let connection: PoolConnection | null = null;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Kiểm tra khóa học tồn tại và là FREE
        const [courses] = await connection.execute<RowDataPacket[]>(
            "SELECT id, type, price, published FROM courses WHERE id = ?",
            [courseId]
        );

        if (courses.length === 0) {
            throw new NotFoundError("Không tìm thấy khóa học", ErrorCodes.COURSE_NOT_FOUND);
        }

        const course = courses[0];

        if (!course.published) {
            throw new ValidationError("Khóa học chưa được xuất bản", ErrorCodes.INVALID_INPUT_FORMAT);
        }

        if (course.type !== "FREE" && Number(course.price) > 0) {
            throw new ValidationError(
                "Khóa học này yêu cầu thanh toán. Vui lòng mua khóa học trước.",
                ErrorCodes.INVALID_INPUT_FORMAT
            );
        }

        // Kiểm tra đã enroll chưa
        const [existing] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
            [user.id, courseId]
        );

        if (existing.length > 0) {
            // Idempotent: đã enroll rồi vẫn trả success (không phải lỗi)
            await connection.commit();
            return NextResponse.json({
                success: true,
                message: "Bạn đã đăng ký khóa học này rồi",
                alreadyEnrolled: true,
            });
        }

        // Xác minh user còn tồn tại trong DB
        const [dbUser] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ?",
            [user.id]
        );
        if (dbUser.length === 0) {
            throw new AuthenticationError(
                "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại",
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // ④ INSERT enrollment
        const enrollId = crypto.randomUUID();
        await connection.execute(
            "INSERT INTO enrollments (id, user_id, course_id, status, progress) VALUES (?, ?, ?, 'ACTIVE', 0)",
            [enrollId, user.id, courseId]
        );

        // ⑤ UPDATE students count (cùng transaction — atomic!)
        await connection.execute(
            "UPDATE courses SET students = students + 1 WHERE id = ?",
            [courseId]
        );

        // ⑥ Commit transaction
        await connection.commit();

        return NextResponse.json(
            { success: true, message: "Đăng ký khóa học thành công!" },
            { status: 201 }
        );

    } catch (error) {
        // Rollback nếu có lỗi
        if (connection) {
            await connection.rollback();
        }
        return handleApiError(error);
    } finally {
        // Luôn release connection về pool
        if (connection) {
            connection.release();
        }
    }
}
