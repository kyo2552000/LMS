import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const offset = (page - 1) * limit;

        let query = `
      SELECT c.*, 
             cat.name as category_name, cat.icon as category_icon, cat.color as category_color,
             u.name as instructor_name, u.avatar as instructor_avatar
      FROM courses c
      JOIN categories cat ON c.category_id = cat.id
      JOIN users u ON c.instructor_id = u.id
      WHERE c.published = TRUE
    `;
        let countQuery = `SELECT COUNT(*) as total FROM courses c JOIN categories cat ON c.category_id = cat.id WHERE c.published = TRUE`;
        const params: string[] = [];
        const countParams: string[] = [];

        if (category) {
            query += ` AND cat.name = ?`;
            countQuery += ` AND cat.name = ?`;
            params.push(category);
            countParams.push(category);
        }

        if (search) {
            query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
            countQuery += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
        params.push(String(limit), String(offset));

        const [courses] = await db.execute<RowDataPacket[]>(query, params);
        const [countResult] = await db.execute<RowDataPacket[]>(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        // Get lessons for each course
        for (const course of courses) {
            const [lessons] = await db.execute<RowDataPacket[]>(
                "SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC",
                [course.id]
            );
            course.lessons = lessons;
        }

        return NextResponse.json({
            courses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
}
