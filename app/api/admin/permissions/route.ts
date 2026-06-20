import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/permissions - list all permissions grouped by module
export async function GET() {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM permissions ORDER BY module, name"
    );

    // Group by module
    const grouped: Record<string, RowDataPacket[]> = {};
    for (const row of rows) {
        if (!grouped[row.module]) grouped[row.module] = [];
        grouped[row.module].push(row);
    }

    return NextResponse.json({ permissions: rows, grouped });
}
