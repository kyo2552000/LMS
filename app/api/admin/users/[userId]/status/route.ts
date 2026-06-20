import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { validateInput } from "@/lib/validation";
import {
    handleApiError,
    AuthorizationError,
    NotFoundError,
    ErrorCodes,
} from "@/lib/api-error";

const UpdateStatusSchema = z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "BANNED"], {
        error: "Status phải là ACTIVE, INACTIVE hoặc BANNED",
    }),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const admin = await requireAdmin();
        if (!admin) throw new AuthorizationError("Chỉ Admin mới có quyền này", ErrorCodes.INSUFFICIENT_PERMISSIONS);

        const { userId } = await params;

        const body = await request.json().catch(() => ({}));
        const validation = validateInput(UpdateStatusSchema, body);
        if (!validation.success) return validation.response;
        const { status } = validation.data;

        // Không cho phép admin tự ban bản thân
        if (userId === admin.id && status === "BANNED") {
            return NextResponse.json(
                { error: "Bạn không thể tự khóa tài khoản của mình" },
                { status: 400 }
            );
        }

        const [result] = await db.execute(
            "UPDATE users SET status = ? WHERE id = ?",
            [status, userId]
        );

        const affected = (result as { affectedRows: number }).affectedRows;
        if (affected === 0) throw new NotFoundError("Không tìm thấy người dùng", ErrorCodes.USER_NOT_FOUND);

        return NextResponse.json({
            success: true,
            message: status === "BANNED"
                ? "Đã khóa tài khoản người dùng"
                : status === "ACTIVE"
                ? "Đã mở khóa tài khoản người dùng"
                : "Đã cập nhật trạng thái người dùng",
        });
    } catch (error) {
        return handleApiError(error);
    }
}
