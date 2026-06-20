import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";

// POST /api/coupons/validate - validate a coupon code and return discount info
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, coursePrice } = await request.json();
    if (!code?.trim()) return NextResponse.json({ error: "Nhập mã giảm giá" }, { status: 400 });

    // Find coupon
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE'`,
        [code.trim().toUpperCase()]
    );

    const coupons = rows as RowDataPacket[];
    if (coupons.length === 0) {
        return NextResponse.json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" }, { status: 404 });
    }

    const coupon = coupons[0];

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usage_limit !== null) {
        const [usageRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as cnt FROM coupon_usage WHERE coupon_id = ?`,
            [coupon.id]
        );
        const used = (usageRows as RowDataPacket[])[0]?.cnt || 0;
        if (used >= coupon.usage_limit) {
            return NextResponse.json({ error: "Mã giảm giá đã được sử dụng hết" }, { status: 400 });
        }
    }

    // Check min order amount
    const price = parseFloat(coursePrice) || 0;
    if (coupon.min_order_amount && price < parseFloat(coupon.min_order_amount)) {
        return NextResponse.json({
            error: `Đơn hàng tối thiểu ${Number(coupon.min_order_amount).toLocaleString('vi-VN')}đ để dùng mã này`
        }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
        discountAmount = (price * parseFloat(coupon.discount_value)) / 100;
        if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
        }
    } else {
        // FIXED
        discountAmount = Math.min(parseFloat(coupon.discount_value), price);
    }

    const finalPrice = Math.max(0, price - discountAmount);

    return NextResponse.json({
        valid: true,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            description: coupon.description,
        },
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalPrice: parseFloat(finalPrice.toFixed(2)),
    });
}
