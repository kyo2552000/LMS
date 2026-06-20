/**
 * POST /api/auth/login
 * ✅ Upgraded with:
 *   - Rate limiting (10 requests / 15 phút) — từ YoloHub's authRateLimit
 *   - Zod input validation — từ YoloHub's validateBody middleware
 *   - Account status check (INACTIVE / BANNED) — từ YoloHub's authMiddleware
 *   - Centralized error handling — từ YoloHub's errorHandler
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
import { validateInput, LoginSchema } from "@/lib/validation";
import {
    handleApiError,
    AuthenticationError,
    ErrorCodes,
} from "@/lib/api-error";

export async function POST(request: NextRequest) {
    // ① Rate Limiting — ported from YoloHub's authRateLimit middleware
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, AUTH_RATE_LIMIT);
    if (!rateLimit.success) {
        return NextResponse.json(
            {
                success: false,
                error: `Quá nhiều lần đăng nhập thất bại. Thử lại sau ${rateLimit.retryAfter} giây.`,
                errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED,
                retryAfter: rateLimit.retryAfter,
            },
            {
                status: 429,
                headers: { "Retry-After": String(rateLimit.retryAfter) },
            }
        );
    }

    try {
        // ② Zod Validation — ported from YoloHub's validateBody(LoginSchema)
        const body = await request.json().catch(() => ({}));
        const validation = validateInput(LoginSchema, body);
        if (!validation.success) return validation.response;
        const { email, password } = validation.data;

        // ③ Tìm user
        const [users] = await db.execute<RowDataPacket[]>(
            "SELECT id, email, name, password, role, avatar, status FROM users WHERE email = ?",
            [email]
        );

        // Trả lỗi chung chung (không tiết lộ email có tồn tại không)
        if (users.length === 0) {
            throw new AuthenticationError(
                "Email hoặc mật khẩu không chính xác",
                ErrorCodes.INVALID_CREDENTIALS
            );
        }

        const user = users[0];

        // ④ Account Status Check — ported from YoloHub's authMiddleware
        if (user.status === "INACTIVE") {
            throw new AuthenticationError(
                "Tài khoản chưa được kích hoạt. Vui lòng liên hệ admin.",
                ErrorCodes.ACCOUNT_INACTIVE
            );
        }

        if (user.status === "BANNED") {
            throw new AuthenticationError(
                "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.",
                ErrorCodes.ACCOUNT_BANNED
            );
        }

        // ⑤ Kiểm tra mật khẩu
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new AuthenticationError(
                "Email hoặc mật khẩu không chính xác",
                ErrorCodes.INVALID_CREDENTIALS
            );
        }

        // ⑥ Tạo JWT & set cookie
        const token = signToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            },
        });

        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 ngày
            path: "/",
        });

        return response;

    } catch (error) {
        // ⑦ Centralized error handler — ported from YoloHub's errorHandler
        return handleApiError(error);
    }
}
