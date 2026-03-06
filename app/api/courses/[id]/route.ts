import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get course with category and instructor
        const [courses] = await db.execute<RowDataPacket[]>(
            `SELECT c.*, 
              cat.name as category_name, cat.icon as category_icon, cat.color as category_color,
              u.name as instructor_name, u.avatar as instructor_avatar, u.bio as instructor_bio
       FROM courses c
       JOIN categories cat ON c.category_id = cat.id
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
            [id]
        );

        if (courses.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const course = courses[0];

        // Get lessons
        const [lessons] = await db.execute<RowDataPacket[]>(
            "SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC",
            [id]
        );
        course.lessons = lessons;

        // Get reviews with user info
        const [reviews] = await db.execute<RowDataPacket[]>(
            `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.course_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
            [id]
        );
        course.reviews = reviews;

        // Check if current user is enrolled
        const user = await getAuthUser();
        course.isEnrolled = false;
        if (user) {
            const [enrollment] = await db.execute<RowDataPacket[]>(
                "SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?",
                [id, user.id]
            );
            if (enrollment.length > 0) {
                course.isEnrolled = true;
            }
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json(
            { error: "Failed to fetch course" },
            { status: 500 }
        );
    }
}
