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

const UpdateRoleSchema = z.object({
    role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"], {
        error: "Role phải là STUDENT, INSTRUCTOR hoặc ADMIN",
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
        const validation = validateInput(UpdateRoleSchema, body);
        if (!validation.success) return validation.response;
        const { role } = validation.data;

        // Không cho phép admin tự hạ cấp bản thân
        if (userId === admin.id && role !== "ADMIN") {
            return NextResponse.json(
                { error: "Bạn không thể thay đổi vai trò của chính mình" },
                { status: 400 }
            );
        }

        const [result] = await db.execute(
            "UPDATE users SET role = ? WHERE id = ?",
            [role, userId]
        );

        const affected = (result as { affectedRows: number }).affectedRows;
        if (affected === 0) throw new NotFoundError("Không tìm thấy người dùng", ErrorCodes.USER_NOT_FOUND);

        return NextResponse.json({
            success: true,
            message: `Đã đổi vai trò thành ${role}`,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
