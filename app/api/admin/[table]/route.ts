import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/lib/auth";

async function checkAdmin() {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return null;
    return user;
}

// GET: fetch rows from a table
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });

    const { table } = await params;
    const allowedTables = ["users", "courses", "categories", "lessons", "enrollments", "reviews", "orders", "chat_messages", "lesson_progress"];
    if (!allowedTables.includes(table)) {
        return NextResponse.json({ error: "Bảng không được phép" }, { status: 400 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT * FROM \`${table}\` ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [String(limit), String(offset)]
        );

        const [countResult] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM \`${table}\``
        );
        const total = countResult[0]?.total || 0;

        // Get column info
        const [columns] = await db.execute<RowDataPacket[]>(
            `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'edulearn' AND TABLE_NAME = ?`,
            [table]
        );

        return NextResponse.json({ rows, total, columns, page, limit });
    } catch (error) {
        console.error(`Admin table ${table} error:`, error);
        return NextResponse.json({ error: "Lấy dữ liệu thất bại" }, { status: 500 });
    }
}

// POST: insert a new row
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });

    const { table } = await params;
    const allowedTables = ["users", "courses", "categories", "lessons", "enrollments", "reviews"];
    if (!allowedTables.includes(table)) {
        return NextResponse.json({ error: "Bảng không được phép" }, { status: 400 });
    }

    try {
        const { data } = await request.json();
        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Yêu cầu dữ liệu" }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const insertData: Record<string, any> = { id, ...data };

        // Handle missing defaults for courses table since they are NOT NULL
        if (table === "courses") {
            if (!insertData.instructor_id) {
                insertData.instructor_id = admin.id;
            }
            if (!insertData.category_id) {
                const [categories] = await db.execute<RowDataPacket[]>("SELECT id FROM categories LIMIT 1");
                if (categories.length > 0) {
                    insertData.category_id = categories[0].id;
                } else {
                    return NextResponse.json({ error: "Không tồn tại danh mục. Vui lòng tạo danh mục trước." }, { status: 400 });
                }
            }

            // Fix out of range errors for DECIMAL(3,2) and INT fields
            if (!insertData.rating || insertData.rating === '') insertData.rating = 0;
            if (Number(insertData.rating) > 9.99 || Number(insertData.rating) < 0) insertData.rating = 0;
            if (!insertData.students || insertData.students === '') insertData.students = 0;
        }

        const columns = Object.keys(insertData).map(k => `\`${k}\``).join(", ");
        const placeholders = Object.keys(insertData).map(() => "?").join(", ");
        const values = Object.values(insertData);

        const [result] = await db.execute<ResultSetHeader>(
            `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`,
            values as any[]
        );

        return NextResponse.json({ id, affectedRows: result.affectedRows });
    } catch (error: unknown) {
        const err = error as { sqlMessage?: string; message?: string };
        return NextResponse.json({ error: err.sqlMessage || err.message || "Thêm mới thất bại" }, { status: 400 });
    }
}

// PUT: update a row
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });

    const { table } = await params;
    const allowedTables = ["users", "courses", "categories", "lessons", "enrollments", "reviews"];
    if (!allowedTables.includes(table)) {
        return NextResponse.json({ error: "Bảng không được phép" }, { status: 400 });
    }

    try {
        const { id, data } = await request.json();
        if (!id || !data) {
            return NextResponse.json({ error: "Yêu cầu ID và dữ liệu" }, { status: 400 });
        }

        const setClauses = Object.keys(data).map((key) => `\`${key}\` = ?`).join(", ");
        const values = [...Object.values(data), id];

        const [result] = await db.execute<ResultSetHeader>(
            `UPDATE \`${table}\` SET ${setClauses} WHERE id = ?`,
            values
        );

        return NextResponse.json({ affectedRows: result.affectedRows });
    } catch (error: unknown) {
        const err = error as { sqlMessage?: string; message?: string };
        return NextResponse.json({ error: err.sqlMessage || err.message || "Cập nhật thất bại" }, { status: 400 });
    }
}

// DELETE: delete a row
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });

    const { table } = await params;
    const allowedTables = ["users", "courses", "categories", "lessons", "enrollments", "reviews", "chat_messages", "lesson_progress"];
    if (!allowedTables.includes(table)) {
        return NextResponse.json({ error: "Bảng không được phép" }, { status: 400 });
    }

    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: " Yêu cầu ID" }, { status: 400 });
        }

        const [result] = await db.execute<ResultSetHeader>(
            `DELETE FROM \`${table}\` WHERE id = ?`,
            [id]
        );

        return NextResponse.json({ affectedRows: result.affectedRows });
    } catch (error: unknown) {
        const err = error as { sqlMessage?: string; message?: string };
        return NextResponse.json({ error: err.sqlMessage || err.message || "Delete failed" }, { status: 400 });
    }
}
