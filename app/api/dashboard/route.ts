
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";
import {
    handleApiError,
    AuthenticationError,
    ErrorCodes,
} from "@/lib/api-error";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("q") || "";

        const params: (string)[] = [user.id];
        let whereClause = "";
        if (search) {
            whereClause = ` AND c.title LIKE ?`;
            params.push(`%${search}%`);
        }

        const [courses] = await db.execute<RowDataPacket[]>(
            `SELECT c.id, c.title, c.image, c.level, c.type, c.price, c.rating, c.students,
                    cat.name as category_name,
                    u.name  as instructor_name,
                    e.progress as user_progress,
                    e.status   as enrollment_status,
                    e.enrolled_at
             FROM enrollments e
             JOIN courses c      ON e.course_id   = c.id
             JOIN categories cat ON c.category_id = cat.id
             JOIN users u        ON c.instructor_id = u.id
             WHERE e.user_id = ?${whereClause}
             ORDER BY e.enrolled_at DESC`,
            params
        );

        // Fix N+1: Lấy lessons của tất cả courses trong 1 batch query
        if (courses.length > 0) {
            const courseIds = courses.map((c) => c.id);
            const placeholders = courseIds.map(() => "?").join(",");

            const [allLessons] = await db.execute<RowDataPacket[]>(
                `SELECT id, title, duration, type, sort_order, course_id
                 FROM lessons WHERE course_id IN (${placeholders})
                 ORDER BY sort_order ASC`,
                courseIds
            );

            // Group lessons by course_id — O(n) grouping
            const lessonsByCourse = new Map<string, RowDataPacket[]>();
            for (const lesson of allLessons) {
                if (!lessonsByCourse.has(lesson.course_id)) {
                    lessonsByCourse.set(lesson.course_id, []);
                }
                lessonsByCourse.get(lesson.course_id)!.push(lesson);
            }

            for (const course of courses) {
                course.lessons = lessonsByCourse.get(course.id) ?? [];
            }
        }

        // Tổng hợp stats
        const completed  = courses.filter((c) => c.enrollment_status === "COMPLETED").length;
        const inProgress = courses.filter((c) => c.enrollment_status === "ACTIVE").length;

        return NextResponse.json({
            courses,
            stats: {
                total:      courses.length,
                completed,
                inProgress,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
