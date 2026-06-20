
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, PoolConnection } from "mysql2/promise";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";
import { z } from "zod";
import { checkRateLimit, getClientIp, PAYMENT_RATE_LIMIT } from "@/lib/rate-limit";
import { validateInput } from "@/lib/validation";
import {
    handleApiError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    ConflictError,
    ErrorCodes,
} from "@/lib/api-error";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateOrderSchema = z.object({
    courseId:   z.string().min(1, "courseId là bắt buộc"),
    couponCode: z.string().max(50).optional(),
});

const UpdateOrderSchema = z.object({
    orderId: z.string().min(1, "orderId là bắt buộc"),
    status:  z.enum(["PENDING", "PAID", "CANCELLED", "REFUNDED"], {
        error: "Status không hợp lệ",
    }),
});

// ─── GET: danh sách orders ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        const { searchParams } = new URL(request.url);
        const page   = Math.max(1, parseInt(searchParams.get("page")  || "1"));
        const limit  = Math.min(50, parseInt(searchParams.get("limit") || "20"));
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, c.title as course_title, c.image as course_image,
                   u.name as user_name, u.email as user_email
            FROM orders o
            JOIN courses c ON o.course_id = c.id
            JOIN users u   ON o.user_id   = u.id
        `;
        let countQuery = `SELECT COUNT(*) as total FROM orders o`;
        const params: (string | number)[] = [];
        const countParams: (string | number)[] = [];

        if (user.role !== "ADMIN") {
            query      += ` WHERE o.user_id = ?`;
            countQuery += ` WHERE o.user_id = ?`;
            params.push(user.id);
            countParams.push(user.id);
        }

        query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
        params.push(String(limit), String(offset));

        
        const [[rows], [countResult]] = await Promise.all([
            db.execute<RowDataPacket[]>(query, params),
            db.execute<RowDataPacket[]>(countQuery, countParams),
        ]);

        return NextResponse.json({
            orders: rows,
            pagination: {
                total: countResult[0]?.total ?? 0,
                page,
                limit,
                totalPages: Math.ceil((countResult[0]?.total ?? 0) / limit),
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─── POST: tạo order mới ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    // Rate limiting — ported from YoloHub's paymentRateLimit
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, PAYMENT_RATE_LIMIT);
    if (!rateLimit.success) {
        return NextResponse.json(
            { success: false, error: `Quá nhiều yêu cầu thanh toán. Thử lại sau ${rateLimit.retryAfter}s.`, errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED },
            { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
        );
    }

    let connection: PoolConnection | null = null;
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        // Zod validation
        const body = await request.json().catch(() => ({}));
        const validation = validateInput(CreateOrderSchema, body);
        if (!validation.success) return validation.response;
        const { courseId, couponCode } = validation.data;

        // ── Transaction: toàn bộ create order là atomic ──────────────────────
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Lấy thông tin khóa học
        const [courses] = await connection.execute<RowDataPacket[]>(
            "SELECT id, title, price, type, published FROM courses WHERE id = ? FOR UPDATE",
            [courseId]
        );
        if (courses.length === 0) throw new NotFoundError("Không tìm thấy khóa học", ErrorCodes.COURSE_NOT_FOUND);
        const course = courses[0];
        if (!course.published) throw new ValidationError("Khóa học chưa được xuất bản", ErrorCodes.INVALID_INPUT_FORMAT);

        // 2. Kiểm tra đã mua chưa
        const [existingPaid] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM orders WHERE user_id = ? AND course_id = ? AND status = 'PAID'",
            [user.id, courseId]
        );
        if (existingPaid.length > 0) throw new ConflictError("Bạn đã mua khóa học này rồi", ErrorCodes.DUPLICATE_ENTRY);

        // 3. Kiểm tra đơn PENDING còn tồn tại → trả lại
        const [existingPending] = await connection.execute<RowDataPacket[]>(
            "SELECT id, amount, discount_amount FROM orders WHERE user_id = ? AND course_id = ? AND status = 'PENDING'",
            [user.id, courseId]
        );
        if (existingPending.length > 0) {
            const pending = existingPending[0];
            await connection.commit();
            return NextResponse.json({
                orderId: pending.id,
                amount: pending.amount,
                discountAmount: pending.discount_amount,
                originalPrice: course.price,
                message: "Đơn hàng đang chờ thanh toán",
            });
        }

        // 4. Tính giá sau coupon
        let finalAmount   = parseFloat(course.price) || 0;
        let discountAmount = 0;
        let couponId: string | null = null;

        if (couponCode?.trim()) {
            const [couponRows] = await connection.execute<RowDataPacket[]>(
                `SELECT * FROM coupons
                 WHERE code = ? AND status = 'ACTIVE'
                   AND (expires_at IS NULL OR expires_at > NOW())
                   AND (usage_limit IS NULL OR usage_count < usage_limit)`,
                [couponCode.trim().toUpperCase()]
            );
            if (couponRows.length > 0) {
                const coupon = couponRows[0];
                if (finalAmount >= (parseFloat(coupon.min_order_amount) || 0)) {
                    if (coupon.discount_type === "PERCENTAGE") {
                        discountAmount = (finalAmount * parseFloat(coupon.discount_value)) / 100;
                        if (coupon.max_discount_amount) {
                            discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
                        }
                    } else {
                        discountAmount = Math.min(parseFloat(coupon.discount_value), finalAmount);
                    }
                    finalAmount = Math.max(0, finalAmount - discountAmount);
                    couponId = coupon.id;
                }
            }
        }

        // 5. Tạo order
        const orderStatus = finalAmount === 0 ? "PAID" : "PENDING";
        const paidAt      = finalAmount === 0 ? new Date().toISOString().slice(0, 19).replace("T", " ") : null;
        const orderId     = crypto.randomUUID();

        await connection.execute(
            `INSERT INTO orders (id, user_id, course_id, amount, discount_amount, coupon_id, status, paid_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderId, user.id, courseId, finalAmount, discountAmount, couponId, orderStatus, paidAt]
        );

        // 6. Auto-enroll nếu free / 100% discount
        if (orderStatus === "PAID") {
            await connection.execute(
                "INSERT INTO enrollments (id, user_id, course_id, status, progress) VALUES (?, ?, ?, 'ACTIVE', 0)",
                [crypto.randomUUID(), user.id, courseId]
            );
            await connection.execute(
                "UPDATE courses SET students = students + 1 WHERE id = ?",
                [courseId]
            );
        }

        // 7. Ghi coupon usage + tăng usage_count
        if (couponId) {
            await connection.execute(
                "INSERT IGNORE INTO coupon_usage (id, coupon_id, user_id, order_id, used_at) VALUES (UUID(), ?, ?, ?, NOW())",
                [couponId, user.id, orderId]
            );
            await connection.execute(
                "UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?",
                [couponId]
            );
        }

        // 8. Thêm thông báo hệ thống
        const notifId = crypto.randomUUID();
        const notifTitle = orderStatus === "PAID" ? "Đăng ký thành công" : "Đơn hàng mới";
        const notifBody = orderStatus === "PAID" 
            ? `Bạn đã đăng ký thành công khóa học: ${course.title}`
            : `Đơn hàng cho khóa học ${course.title} đang chờ thanh toán.`;
        
        await connection.execute(
            "INSERT INTO notifications (id, user_id, title, message, type, href, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                notifId, 
                user.id, 
                notifTitle, 
                notifBody, 
                orderStatus === "PAID" ? "COURSE" : "PAYMENT",
                orderStatus === "PAID" ? `/courses/${course.id}/learn` : "/orders",
                course.id
            ]
        );

        await connection.commit();

        return NextResponse.json({
            orderId,
            amount: parseFloat(finalAmount.toFixed(2)),
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            originalPrice: course.price,
            status: orderStatus,
            message: orderStatus === "PAID" ? "Đăng ký thành công!" : "Đơn hàng đã được tạo",
        }, { status: 201 });

    } catch (error) {
        if (connection) await connection.rollback();
        return handleApiError(error);
    } finally {
        if (connection) connection.release();
    }
}

// ─── PUT: admin confirm order → PAID ─────────────────────────────────────────

export async function PUT(request: NextRequest) {
    let connection: PoolConnection | null = null;
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);
        if (user.role !== "ADMIN") throw new AuthorizationError("Chỉ Admin mới có quyền này", ErrorCodes.INSUFFICIENT_PERMISSIONS);

        const body = await request.json().catch(() => ({}));
        const validation = validateInput(UpdateOrderSchema, body);
        if (!validation.success) return validation.response;
        const { orderId, status } = validation.data;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const paidAt = status === "PAID" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null;
        await connection.execute(
            "UPDATE orders SET status = ?, paid_at = ? WHERE id = ?",
            [status, paidAt, orderId]
        );

        // Auto-enroll khi PAID
        if (status === "PAID") {
            const [orders] = await connection.execute<RowDataPacket[]>(
                "SELECT user_id, course_id FROM orders WHERE id = ?",
                [orderId]
            );
            if (orders.length > 0) {
                const { user_id, course_id } = orders[0];
                const [existing] = await connection.execute<RowDataPacket[]>(
                    "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
                    [user_id, course_id]
                );
                if (existing.length === 0) {
                    await connection.execute(
                        "INSERT INTO enrollments (id, user_id, course_id, status, progress) VALUES (?, ?, ?, 'ACTIVE', 0)",
                        [crypto.randomUUID(), user_id, course_id]
                    );
                    await connection.execute(
                        "UPDATE courses SET students = students + 1 WHERE id = ?",
                        [course_id]
                    );
                }
            }

            // Thêm thông báo cho user
            const [orderData] = await connection.execute<RowDataPacket[]>(
                "SELECT o.user_id, c.title, o.course_id FROM orders o JOIN courses c ON o.course_id = c.id WHERE o.id = ?",
                [orderId]
            );
            if (orderData.length > 0) {
                const { user_id, title, course_id } = orderData[0];
                await connection.execute(
                    "INSERT INTO notifications (id, user_id, title, message, type, href, entity_id) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
                    [
                        user_id, 
                        "Thanh toán thành công", 
                        `Đơn hàng cho khóa học "${title}" đã được xác nhận.`, 
                        "PAYMENT",
                        `/courses/${course_id}/learn`,
                        course_id
                    ]
                );
            }
        }

        await connection.commit();
        return NextResponse.json({ success: true, message: status === "PAID" ? "Xác nhận thanh toán & đăng ký thành công" : "Cập nhật đơn hàng thành công" });

    } catch (error) {
        if (connection) await connection.rollback();
        return handleApiError(error);
    } finally {
        if (connection) connection.release();
    }
}
