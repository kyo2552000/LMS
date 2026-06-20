/**
 * POST /api/auth/register
 * ✅ Upgraded with:
 *   - Rate limiting (10 requests / 15 phút) — từ YoloHub's createAccountRateLimit
 *   - Zod input validation (email format, password strength) — từ YoloHub's validateBody
 *   - Centralized error handling — từ YoloHub's errorHandler
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
import { validateInput, RegisterSchema } from "@/lib/validation";
import {
    handleApiError,
    ConflictError,
    ErrorCodes,
} from "@/lib/api-error";

export async function POST(request: NextRequest) {
    // ① Rate Limiting — ported from YoloHub's createAccountRateLimit
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, {
        ...AUTH_RATE_LIMIT,
        namespace: "register", // Namespace riêng để không dùng chung với login
    });
    if (!rateLimit.success) {
        return NextResponse.json(
            {
                success: false,
                error: `Quá nhiều yêu cầu đăng ký. Thử lại sau ${rateLimit.retryAfter} giây.`,
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
        // ② Zod Validation — ported from YoloHub's validateRegistration middleware
        // RegisterSchema kiểm tra: tên >= 2 ký tự, email hợp lệ, mật khẩu >= 6 ký tự + có chữ và số
        const body = await request.json().catch(() => ({}));
        const validation = validateInput(RegisterSchema, body);
        if (!validation.success) return validation.response;
        const { name, email, password } = validation.data;

        // ③ Kiểm tra email đã tồn tại
        const [existing] = await db.execute<RowDataPacket[]>(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            throw new ConflictError(
                "Email này đã được đăng ký",
                ErrorCodes.USER_ALREADY_EXISTS
            );
        }

        // ④ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        // ⑤ Insert user với status ACTIVE (mặc định)
        // (YoloHub dùng INACTIVE + email verification — EDULearn dùng ACTIVE trực tiếp)
        await db.execute(
            "INSERT INTO users (id, email, name, password, role, status) VALUES (?, ?, ?, ?, 'STUDENT', 'ACTIVE')",
            [userId, email, name, hashedPassword]
        );

        // ⑥ Tạo JWT & set cookie
        const token = signToken({
            id: userId,
            email,
            name,
            role: "STUDENT",
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: userId,
                email,
                name,
                role: "STUDENT",
            },
        }, { status: 201 });

        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
            path: "/",
        });

        return response;

    } catch (error) {
        // ⑦ Centralized error handler — ported from YoloHub's errorHandler
        return handleApiError(error);
    }
}
