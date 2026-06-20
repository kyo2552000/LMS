
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const [rows] = await db.execute<RowDataPacket[]>(`
            SELECT id, code, description, discount_type, discount_value,
                   min_order_amount, max_discount_amount, expires_at, usage_limit,
                   (usage_limit - usage_count) as remaining_uses
            FROM coupons
            WHERE status = 'ACTIVE'
              AND (expires_at IS NULL OR expires_at > NOW())
              AND (usage_limit IS NULL OR usage_count < usage_limit)
            ORDER BY created_at DESC
        `);
        return NextResponse.json({ coupons: rows, total: rows.length });
    } catch (error) {
        return handleApiError(error);
    }
}
