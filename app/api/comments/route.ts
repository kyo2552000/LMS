
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";
import { validateInput, CreateCommentSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
    handleApiError,
    AuthenticationError,
    ErrorCodes,
} from "@/lib/api-error";

// ─── GET: lấy comments của course/lesson (dạng tree) ─────────────────────────

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("courseId");
        const lessonId = searchParams.get("lessonId");

        if (!courseId) return NextResponse.json({ error: "courseId là bắt buộc" }, { status: 400 });

        let query = `
            SELECT c.id, c.content, c.parent_id, c.lesson_id, c.likes, c.created_at,
                   u.id as user_id, u.name as user_name, u.avatar as user_avatar, u.role as user_role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.course_id = ? AND c.status = 'VISIBLE'
        `;
        const params: (string | null)[] = [courseId];

        if (lessonId) {
            query += ` AND c.lesson_id = ?`;
            params.push(lessonId);
        } else {
            query += ` AND c.lesson_id IS NULL`;
        }

        query += ` ORDER BY c.created_at DESC`;

        const [rows] = await db.execute<RowDataPacket[]>(query, params);

        // Build tree 
        interface CommentNode extends RowDataPacket { replies: CommentNode[] }
        const commentMap = new Map<string, CommentNode>();
        const rootComments: CommentNode[] = [];

        for (const c of rows as CommentNode[]) {
            c.replies = [];
            commentMap.set(c.id, c);
        }
        for (const c of rows as CommentNode[]) {
            if (c.parent_id && commentMap.has(c.parent_id)) {
                commentMap.get(c.parent_id)!.replies.push(c);
            } else {
                rootComments.push(c);
            }
        }

        return NextResponse.json({ comments: rootComments, total: rootComments.length });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─── POST: đăng comment mới ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // Rate limiting 
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(ip, {
            windowMs: 60 * 1000,  // 1 phút
            limit: 15,            // 15 comments/phút
            namespace: "comment",
        });
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: `Bạn đang bình luận quá nhanh. Thử lại sau ${rateLimit.retryAfter}s.`, errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED },
                { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
            );
        }

        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập để bình luận", ErrorCodes.TOKEN_INVALID);

        // Zod validation
        const body = await request.json().catch(() => ({}));
        const validation = validateInput(CreateCommentSchema, body);
        if (!validation.success) return validation.response;
        const { content, courseId, lessonId, parentId } = validation.data;

        const commentId = crypto.randomUUID();
        await db.execute<ResultSetHeader>(
            `INSERT INTO comments (id, content, user_id, course_id, lesson_id, parent_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'VISIBLE')`,
            [commentId, content, user.id, courseId, lessonId || null, parentId || null]
        );

        // Lấy lại comment vừa tạo kèm user info — để frontend hiển thị ngay
        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT c.id, c.content, c.parent_id, c.lesson_id, c.likes, c.created_at,
                    u.id as user_id, u.name as user_name, u.avatar as user_avatar, u.role as user_role
             FROM comments c JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [commentId]
        );

        const newComment = { ...rows[0], replies: [] };
        return NextResponse.json({ comment: newComment }, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}
