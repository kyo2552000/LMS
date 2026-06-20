
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
    handleApiError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    ErrorCodes,
} from "@/lib/api-error";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const DOC_TYPES   = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(request: NextRequest) {
    try {
        // Auth check — ADMIN only
        const user = await getAuthUser();
        if (!user) throw new AuthenticationError("Vui lòng đăng nhập", ErrorCodes.TOKEN_INVALID);
        if (user.role !== "ADMIN") throw new AuthorizationError("Chỉ Admin mới có quyền upload", ErrorCodes.INSUFFICIENT_PERMISSIONS);

        // Rate limiting 
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(ip, {
            windowMs: 60 * 1000,
            limit: 10,
            namespace: "upload",
        });
        if (!rateLimit.success) {
            return NextResponse.json(
                { success: false, error: `Upload quá nhanh. Thử lại sau ${rateLimit.retryAfter}s.`, errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED },
                { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
            );
        }

        const data = await request.formData();
        const file = data.get("file") as File | null;
        if (!file) throw new ValidationError("Không có file nào được gửi lên", ErrorCodes.REQUIRED_FIELD_MISSING);

        const isVideo = VIDEO_TYPES.includes(file.type);
        const isImage = IMAGE_TYPES.includes(file.type);
        const isDoc   = DOC_TYPES.includes(file.type);

        if (!isVideo && !isImage && !isDoc) {
            throw new ValidationError(
                "Loại file không được hỗ trợ. Chấp nhận: ảnh, video (MP4/WebM), PDF, Word, PowerPoint, Excel",
                ErrorCodes.INVALID_INPUT_FORMAT
            );
        }

        // Size limits: 500MB cho video, 50MB cho file khác
        const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new ValidationError(
                `File quá lớn. Giới hạn: ${isVideo ? "500MB" : "50MB"}`,
                ErrorCodes.INVALID_INPUT_FORMAT
            );
        }

        const bytes  = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const subDir  = isVideo ? "videos" : isImage ? "images" : "docs";
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const uploadDir = join(process.cwd(), `public/uploads/${subDir}`);

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        await writeFile(join(uploadDir, safeName), buffer);

        const storagePath = `${subDir}/${safeName}`;

        return NextResponse.json({
            success: true,
            url:      `/api/media?file=${encodeURIComponent(storagePath)}`,
            storagePath,
            name:     file.name,
            type:     isVideo ? "video" : isImage ? "image" : "document",
            mimeType: file.type,
            size:     file.size,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
