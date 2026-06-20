import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/categories
export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    const searchWhere = search ? `WHERE c.name LIKE ?` : "";
    const params: (string | number)[] = search ? [`%${search}%`] : [];

    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT c.*, COUNT(DISTINCT co.id) as course_count
         FROM categories c
         LEFT JOIN courses co ON co.category_id = c.id
         ${searchWhere}
         GROUP BY c.id
         ORDER BY c.name ASC
         LIMIT ? OFFSET ?`,
        [...params, String(limit), String(offset)]
    );

    const [total] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM categories ${searchWhere}`,
        search ? [`%${search}%`] : []
    );

    return NextResponse.json({ rows, total: (total[0] as RowDataPacket).cnt });
}

// POST /api/admin/categories
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, description, icon, color } = await request.json();
    if (!name?.trim()) {
        return NextResponse.json({ error: "Tên danh mục là bắt buộc" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const autoSlug = slug || name.trim().toLowerCase().replace(/\s+/g, "-");

    await db.execute(
        "INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name.trim(), autoSlug, description || "", icon || "📁", color || "bg-blue-500"]
    );

    return NextResponse.json({ message: "Tạo danh mục thành công", id });
}

// PUT /api/admin/categories
export async function PUT(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, slug, description, icon, color } = await request.json();
    if (!id || !name?.trim()) {
        return NextResponse.json({ error: "ID và tên là bắt buộc" }, { status: 400 });
    }

    const autoSlug = slug || name.trim().toLowerCase().replace(/\s+/g, "-");
    await db.execute(
        "UPDATE categories SET name=?, slug=?, description=?, icon=?, color=? WHERE id=?",
        [name.trim(), autoSlug, description || "", icon || "📁", color || "bg-blue-500", id]
    );

    return NextResponse.json({ message: "Cập nhật danh mục thành công" });
}

// DELETE /api/admin/categories
export async function DELETE(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });

    const [courses] = await db.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM courses WHERE category_id=?", [id]
    );
    if ((courses[0] as RowDataPacket).cnt > 0) {
        return NextResponse.json(
            { error: "Không thể xóa danh mục đang có khóa học" },
            { status: 400 }
        );
    }

    await db.execute("DELETE FROM categories WHERE id=?", [id]);
    return NextResponse.json({ message: "Xóa danh mục thành công" });
}
