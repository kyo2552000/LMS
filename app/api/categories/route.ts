
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const [categories] = await db.execute<RowDataPacket[]>(
            `SELECT cat.id, cat.name, cat.slug, cat.icon, cat.color, cat.description,
                    COUNT(c.id) as course_count
             FROM categories cat
             LEFT JOIN courses c ON cat.id = c.category_id AND c.published = TRUE
             GROUP BY cat.id
             ORDER BY cat.name ASC`
        );
        return NextResponse.json({ categories, total: categories.length });
    } catch (error) {
        return handleApiError(error);
    }
}
