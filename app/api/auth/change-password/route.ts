
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";
import { getAuthUser } from "@/lib/auth";
import { validateInput, ChangePasswordSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
import {
    handleApiError,
    AuthenticationError,
    NotFoundError,
    ErrorCodes,
} from "@/lib/api-error";

export async function POST(request: NextRequest) {
    // Rate limiting — chia sẻ namespace auth
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, { ...AUTH_RATE_LIMIT, namespace: "change-password" });
    if (!rateLimit.success) {
        return NextResponse.json(
            { success: false, error: `Thử lại sau ${rateLimit.retryAfter}s.`, errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED },
            { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
        );
    }

    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        // Zod validation 
        const body = await request.json().catch(() => ({}));
        const validation = validateInput(ChangePasswordSchema, body);
        if (!validation.success) return validation.response;
        const { currentPassword, newPassword } = validation.data;

        // Lấy hash từ DB
        const [users] = await db.execute<RowDataPacket[]>(
            "SELECT id, password FROM users WHERE id = ?",
            [user.id]
        );
        if (users.length === 0) throw new NotFoundError("Không tìm thấy người dùng", ErrorCodes.USER_NOT_FOUND);

        // Verify mật khẩu hiện tại
        const isValid = await bcrypt.compare(currentPassword, users[0].password);
        if (!isValid) {
            throw new AuthenticationError("Mật khẩu hiện tại không chính xác", ErrorCodes.INVALID_CREDENTIALS);
        }

        // Hash & update
        const hashed = await bcrypt.hash(newPassword, 10);
        await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);

        return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
        return handleApiError(error);
    }
}
