
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import { validateInput } from "@/lib/validation";
import {
    handleApiError,
    AuthenticationError,
    NotFoundError,
    ErrorCodes,
} from "@/lib/api-error";

const UpdateProfileSchema = z.object({
    name:   z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100).trim(),
    bio:    z.string().max(500, "Bio tối đa 500 ký tự").optional(),
    phone:  z.string().max(20, "Số điện thoại tối đa 20 ký tự").optional(),
    avatar: z.string().max(500).optional(),
});

// ─── GET: lấy profile + stats ─────────────────────────────────────────────────

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        // Parallel queries — ported từ YoloHub's Promise.all pattern
        const [[profileRows], [statsRows]] = await Promise.all([
            db.execute<RowDataPacket[]>(
                "SELECT id, name, email, avatar, bio, phone, status, user_type, role, created_at FROM users WHERE id = ?",
                [user.id]
            ),
            db.execute<RowDataPacket[]>(
                `SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN e.status = 'ACTIVE'    THEN 1 ELSE 0 END) as in_progress
                 FROM enrollments e WHERE e.user_id = ?`,
                [user.id]
            ),
        ]);

        if (profileRows.length === 0) throw new NotFoundError("Không tìm thấy người dùng", ErrorCodes.USER_NOT_FOUND);

        return NextResponse.json({
            profile: profileRows[0],
            stats:   statsRows[0],
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─── PUT: cập nhật profile ────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);

        const body = await request.json().catch(() => ({}));
        const validation = validateInput(UpdateProfileSchema, body);
        if (!validation.success) return validation.response;
        const { name, bio, phone, avatar } = validation.data;

        // Validate avatar — chỉ cho phép URL, không cho base64
        let safeAvatar: string | null = null;
        if (avatar && !avatar.startsWith("data:") && avatar.length <= 500) {
            safeAvatar = avatar;
        }

        await db.execute(
            "UPDATE users SET name = ?, bio = ?, phone = ?, avatar = ? WHERE id = ?",
            [name, bio || null, phone || null, safeAvatar, user.id]
        );

        return NextResponse.json({ success: true, message: "Cập nhật hồ sơ thành công" });
    } catch (error) {
        return handleApiError(error);
    }
}
