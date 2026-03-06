import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

// GET: list orders (user sees their own, admin sees all)
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        let query = `
      SELECT o.*, c.title as course_title, c.image as course_image, c.price as course_price,
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN courses c ON o.course_id = c.id
      JOIN users u ON o.user_id = u.id
    `;
        let countQuery = `SELECT COUNT(*) as total FROM orders o`;
        const params: string[] = [];
        const countParams: string[] = [];

        // Non-admin users only see their own orders
        if (user.role !== "ADMIN") {
            query += ` WHERE o.user_id = ?`;
            countQuery += ` WHERE o.user_id = ?`;
            params.push(user.id);
            countParams.push(user.id);
        }

        query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
        params.push(String(limit), String(offset));

        const [rows] = await db.execute<RowDataPacket[]>(query, params);
        const [countResult] = await db.execute<RowDataPacket[]>(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        return NextResponse.json({ orders: rows, total, page, limit });
    } catch (error) {
        console.error("Orders list error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

// POST: create a new order
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await request.json();
        if (!courseId) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 });
        }

        // Get course info
        const [courses] = await db.execute<RowDataPacket[]>(
            "SELECT * FROM courses WHERE id = ?",
            [courseId]
        );

        if (courses.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const course = courses[0];

        // Check if already has a PAID order for this course
        const [existingPaid] = await db.execute<RowDataPacket[]>(
            "SELECT id FROM orders WHERE user_id = ? AND course_id = ? AND status = 'PAID'",
            [user.id, courseId]
        );

        if (existingPaid.length > 0) {
            return NextResponse.json({ error: "You already purchased this course" }, { status: 400 });
        }

        // Check if there's already a PENDING order
        const [existingPending] = await db.execute<RowDataPacket[]>(
            "SELECT id FROM orders WHERE user_id = ? AND course_id = ? AND status = 'PENDING'",
            [user.id, courseId]
        );

        if (existingPending.length > 0) {
            return NextResponse.json({
                orderId: existingPending[0].id,
                message: "Pending order already exists",
            });
        }

        // Create new order
        const orderId = crypto.randomUUID();
        await db.execute<ResultSetHeader>(
            "INSERT INTO orders (id, user_id, course_id, amount, status) VALUES (?, ?, ?, ?, 'PENDING')",
            [orderId, user.id, courseId, course.price]
        );

        return NextResponse.json({
            orderId,
            amount: course.price,
            message: "Order created",
        });
    } catch (error) {
        console.error("Create order error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}

// PUT: update order status (admin only, or mark as paid)
export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
        }

        if (!["PENDING", "PAID"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Only admin can change order status
        if (user.role !== "ADMIN") {
            return NextResponse.json({ error: "Only admin can update order status" }, { status: 403 });
        }

        const paidAt = status === "PAID" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null;

        await db.execute<ResultSetHeader>(
            "UPDATE orders SET status = ?, paid_at = ? WHERE id = ?",
            [status, paidAt, orderId]
        );

        // If marking as PAID, auto-enroll user in the course
        if (status === "PAID") {
            const [orders] = await db.execute<RowDataPacket[]>(
                "SELECT user_id, course_id FROM orders WHERE id = ?",
                [orderId]
            );

            if (orders.length > 0) {
                const order = orders[0];
                // Check if already enrolled
                const [existing] = await db.execute<RowDataPacket[]>(
                    "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
                    [order.user_id, order.course_id]
                );

                if (existing.length === 0) {
                    await db.execute<ResultSetHeader>(
                        "INSERT INTO enrollments (id, user_id, course_id, status) VALUES (?, ?, ?, 'ACTIVE')",
                        [crypto.randomUUID(), order.user_id, order.course_id]
                    );
                }
            }
        }

        return NextResponse.json({ message: `Order ${status === "PAID" ? "confirmed" : "updated"}` });
    } catch (error) {
        console.error("Update order error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
