import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/coupons
export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
        conditions.push("(cp.code LIKE ? OR cp.description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
        conditions.push("cp.status = ?");
        params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT cp.*, u.name as created_by_name
         FROM coupons cp
         LEFT JOIN users u ON u.id = cp.created_by
         ${where}
         ORDER BY cp.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, String(limit), String(offset)]
    );

    const [total] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM coupons cp ${where}`,
        params
    );

    return NextResponse.json({ rows, total: (total[0] as RowDataPacket).cnt });
}

// POST /api/admin/coupons - create
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
        code, description, discount_type, discount_value,
        min_order_amount, max_discount_amount, usage_limit,
        status, expires_at
    } = await request.json();

    if (!code?.trim() || !discount_value) {
        return NextResponse.json({ error: "Mã và giá trị giảm giá là bắt buộc" }, { status: 400 });
    }

    // Check code uniqueness
    const [existing] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM coupons WHERE code=?", [code.trim().toUpperCase()]
    );
    if ((existing as RowDataPacket[]).length > 0) {
        return NextResponse.json({ error: "Mã coupon đã tồn tại" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await db.execute(
        `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, status, expires_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, code.trim().toUpperCase(), description || "", discount_type || "PERCENTAGE",
         parseFloat(discount_value), parseFloat(min_order_amount) || 0,
         max_discount_amount ? parseFloat(max_discount_amount) : null,
         usage_limit ? parseInt(usage_limit) : null,
         status || "ACTIVE", expires_at || null, user.id]
    );

    return NextResponse.json({ message: "Tạo mã giảm giá thành công", id });
}

// PUT /api/admin/coupons - update
export async function PUT(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
        id, code, description, discount_type, discount_value,
        min_order_amount, max_discount_amount, usage_limit,
        status, expires_at
    } = await request.json();

    if (!id || !code?.trim()) {
        return NextResponse.json({ error: "ID và mã là bắt buộc" }, { status: 400 });
    }

    await db.execute(
        `UPDATE coupons SET code=?, description=?, discount_type=?, discount_value=?,
         min_order_amount=?, max_discount_amount=?, usage_limit=?, status=?, expires_at=?
         WHERE id=?`,
        [code.trim().toUpperCase(), description || "", discount_type || "PERCENTAGE",
         parseFloat(discount_value), parseFloat(min_order_amount) || 0,
         max_discount_amount ? parseFloat(max_discount_amount) : null,
         usage_limit ? parseInt(usage_limit) : null,
         status || "ACTIVE", expires_at || null, id]
    );

    return NextResponse.json({ message: "Cập nhật mã giảm giá thành công" });
}

// DELETE /api/admin/coupons
export async function DELETE(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });

    await db.execute("DELETE FROM coupons WHERE id=?", [id]);
    return NextResponse.json({ message: "Xóa mã giảm giá thành công" });
}
