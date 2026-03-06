import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Search text parameter
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('q') || '';

        let query = `
            SELECT c.*, 
                   cat.name as category_name,
                   u.name as instructor_name,
                   e.progress as user_progress
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN categories cat ON c.category_id = cat.id
            JOIN users u ON c.instructor_id = u.id
            WHERE e.user_id = ? AND e.status = 'ACTIVE'
        `;

        const params: any[] = [user.id];

        if (search) {
            query += ` AND c.title LIKE ?`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY e.enrolled_at DESC`;

        const [courses] = await db.execute<RowDataPacket[]>(query, params);

        // Fetch lessons count for each 
        for (const course of courses) {
            const [lessons] = await db.execute<RowDataPacket[]>(
                "SELECT id, duration FROM lessons WHERE course_id = ?",
                [course.id]
            );
            course.lessons = lessons;
            course.category = course.category_name;
            course.instructor = course.instructor_name;
        }

        return NextResponse.json({
            courses
        });

    } catch (error) {
        console.error("Dashboard list error:", error);
        return NextResponse.json({ error: "Failed to fetch enrolled courses" }, { status: 500 });
    }
}
