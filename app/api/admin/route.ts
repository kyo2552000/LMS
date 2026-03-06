import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

async function checkAdmin() {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return null;
    return user;
}

// GET: list all tables and stats
export async function GET() {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const tableNames = ["users", "courses", "categories", "lessons", "enrollments", "reviews", "orders", "chat_messages", "lesson_progress"];
        const tables = [];
        for (const name of tableNames) {
            try {
                const [countResult] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) as cnt FROM \`${name}\``);
                tables.push({ name, rows: countResult[0]?.cnt || 0 });
            } catch {
                tables.push({ name, rows: 0 });
            }
        }
        return NextResponse.json({ tables });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}

// POST: Execute raw SQL query
export async function POST(request: NextRequest) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const { query } = await request.json();
        if (!query || typeof query !== "string") {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const [result] = await db.query(query);

        // Check if it's a SELECT query (returns rows) or a mutation
        if (Array.isArray(result)) {
            return NextResponse.json({ rows: result, type: "select" });
        } else {
            const info = result as { affectedRows?: number; insertId?: number };
            return NextResponse.json({
                affectedRows: info.affectedRows,
                insertId: info.insertId,
                type: "mutation",
            });
        }
    } catch (error: unknown) {
        const err = error as { message?: string; code?: string; sqlMessage?: string };
        return NextResponse.json(
            { error: err.sqlMessage || err.message || "Query failed" },
            { status: 400 }
        );
    }
}

