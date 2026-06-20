/**
 
 * Cung cấp schema validation type-safe cho tất cả API routes.
 * Sử dụng Zod v4 API (required_error → error).
 */
import { z } from "zod";
import { NextResponse } from "next/server";

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
    email: z
        .string()
        .min(1, "Email là bắt buộc")
        .email("Email không hợp lệ")
        .toLowerCase(),
    password: z
        .string()
        .min(1, "Mật khẩu là bắt buộc"),
});

export const RegisterSchema = z.object({
    name: z
        .string()
        .min(2, "Tên phải có ít nhất 2 ký tự")
        .max(100, "Tên không được quá 100 ký tự")
        .trim(),
    email: z
        .string()
        .min(1, "Email là bắt buộc")
        .email("Email không hợp lệ")
        .toLowerCase(),
    password: z
        .string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .max(100, "Mật khẩu không được quá 100 ký tự")
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d)/,
            "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số"
        ),
});

export const ChangePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
        newPassword: z
            .string()
            .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
            .regex(
                /^(?=.*[A-Za-z])(?=.*\d)/,
                "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số"
            ),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
        path: ["newPassword"],
    });

// ─── Course Schemas ───────────────────────────────────────────────────────────

export const GetCoursesQuerySchema = z.object({
    category:  z.string().optional(),
    search:    z.string().max(200, "Từ khóa tìm kiếm quá dài").optional(),
    level:     z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    type:      z.enum(["FREE", "PAID"]).optional(),
    sort:      z.enum(["newest", "popular", "rating", "price_asc", "price_desc"]).default("newest"),
    minRating: z.coerce.number().min(0).max(5).optional(),
    page:      z.coerce.number().int().min(1).default(1),
    limit:     z.coerce.number().int().min(1).max(50).default(12),
});

// ─── Review Schemas ───────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
    courseId: z.string().min(1, "courseId là bắt buộc"),
    rating: z
        .number()
        .int("Đánh giá phải là số nguyên")
        .min(1, "Đánh giá tối thiểu 1 sao")
        .max(5, "Đánh giá tối đa 5 sao"),
    comment: z.string().max(2000, "Nhận xét không được quá 2000 ký tự").optional(),
});

// ─── Comment Schemas ──────────────────────────────────────────────────────────

export const CreateCommentSchema = z.object({
    content: z
        .string()
        .min(1, "Nội dung không được trống")
        .max(5000, "Nội dung không được quá 5000 ký tự")
        .trim(),
    courseId: z.string().min(1, "courseId là bắt buộc"),
    lessonId: z.string().optional(),
    parentId: z.string().optional(),
});

// ─── Enrollment Schema ────────────────────────────────────────────────────────

export const EnrollmentSchema = z.object({
    courseId: z.string().min(1, "courseId là bắt buộc"),
});

// ─── Coupon Schema ────────────────────────────────────────────────────────────

export const ApplyCouponSchema = z.object({
    code: z
        .string()
        .min(1, "Mã coupon không được trống")
        .max(50, "Mã coupon quá dài")
        .toUpperCase()
        .trim(),
    courseId: z.string().min(1, "courseId là bắt buộc"),
});

// ─── Validation Helper ────────────────────────────────────────────────────────

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; response: NextResponse };

/**
 * Parse và validate data bằng Zod schema.
 * Trả về { success: true, data } hoặc { success: false, response } (400 JSON).
 *
 * @example
 * const result = validateInput(LoginSchema, await request.json());
 * if (!result.success) return result.response;
 * const { email, password } = result.data;
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        return {
            success: false,
            response: NextResponse.json(
                {
                    error: "Dữ liệu không hợp lệ",
                    details: errors,
                },
                { status: 400 }
            ),
        };
    }

    return { success: true, data: result.data };
}
