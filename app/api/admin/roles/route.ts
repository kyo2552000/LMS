import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/roles - list all roles with user count + permission count
// GET /api/admin/roles?id=xxx - get permissions of a specific role
export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
        // Return permissions of that role
        const [perms] = await db.execute<RowDataPacket[]>(
            `SELECT p.id, p.name, p.description, p.module
             FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE rp.role_id = ?`,
            [id]
        );
        return NextResponse.json({ role_permissions: perms });
    }

    const [rows] = await db.execute<RowDataPacket[]>(`
        SELECT r.*,
            COUNT(DISTINCT rp.permission_id) AS permission_count,
            COUNT(DISTINCT u.id) AS user_count
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN users u ON u.role_id = r.id
        GROUP BY r.id
        ORDER BY r.created_at ASC
    `);

    return NextResponse.json({ roles: rows });
}

// POST /api/admin/roles - create role
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, color, icon, permission_ids } = await request.json();
    if (!name?.trim()) {
        return NextResponse.json({ error: "Tên vai trò là bắt buộc" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await db.execute(
        "INSERT INTO roles (id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)",
        [id, name.trim(), description || "", color || "blue", icon || "shield"]
    );

    // Insert permissions
    if (permission_ids?.length) {
        for (const pid of permission_ids) {
            await db.execute(
                "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                [id, pid]
            );
        }
    }

    return NextResponse.json({ message: "Tạo vai trò thành công", id });
}

// PUT /api/admin/roles - update role
export async function PUT(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, description, color, icon, permission_ids } = await request.json();
    if (!id || !name?.trim()) {
        return NextResponse.json({ error: "ID và tên là bắt buộc" }, { status: 400 });
    }

    await db.execute(
        "UPDATE roles SET name=?, description=?, color=?, icon=? WHERE id=?",
        [name.trim(), description || "", color || "blue", icon || "shield", id]
    );

    // Replace permissions
    await db.execute("DELETE FROM role_permissions WHERE role_id=?", [id]);
    if (permission_ids?.length) {
        for (const pid of permission_ids) {
            await db.execute(
                "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                [id, pid]
            );
        }
    }

    return NextResponse.json({ message: "Cập nhật vai trò thành công" });
}

// DELETE /api/admin/roles - delete role
export async function DELETE(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });

    // Check if role has users
    const [users] = await db.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM users WHERE role_id=?", [id]
    );
    if ((users[0] as RowDataPacket).cnt > 0) {
        return NextResponse.json(
            { error: "Không thể xóa vai trò đang có người dùng" },
            { status: 400 }
        );
    }

    await db.execute("DELETE FROM roles WHERE id=?", [id]);
    return NextResponse.json({ message: "Xóa vai trò thành công" });
}
