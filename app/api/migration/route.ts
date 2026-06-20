import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        const results = [];
        
        // Thêm cột phone vào users
        try {
            await db.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER bio");
            results.push("Added `phone` to `users`");
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') results.push("`phone` already exists in `users`");
            else throw new Error("users: " + e.message);
        }

        // Thêm cột discount_amount vào orders
        try {
            await db.execute("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER amount");
            results.push("Added `discount_amount` to `orders`");
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') results.push("`discount_amount` already exists in `orders`");
            else throw new Error("orders: " + e.message);
        }

        return NextResponse.json({ success: true, message: "Database migrated successfully", results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
