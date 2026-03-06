import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const [categories] = await db.execute<RowDataPacket[]>(
            `SELECT cat.*, COUNT(c.id) as course_count
       FROM categories cat
       LEFT JOIN courses c ON cat.id = c.category_id AND c.published = TRUE
       GROUP BY cat.id
       ORDER BY cat.name ASC`
        );

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}
