import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";
import { checkRateLimit, getClientIp, CHATBOT_RATE_LIMIT } from "@/lib/rate-limit";
import { handleApiError, ErrorCodes } from "@/lib/api-error";

const BASE_SYSTEM_PROMPT = `Bạn là EduBot, trợ lý học tập AI thông minh cho nền tảng học tập trực tuyến EduLearn. 

Vai trò của bạn:
- Giúp sinh viên tìm các khóa học phù hợp với mục tiêu học tập của họ.
- Trả lời các câu hỏi về nội dung khóa học, trình độ và yêu cầu, dựa trên danh sách khóa học có sẵn.
- Cung cấp mẹo học tập, chiến lược học tập và động lực.
- Giải thích các khái niệm phức tạp một cách đơn giản.
- Đề xuất lộ trình học tập dựa trên sở thích của sinh viên.
- Giúp đỡ các câu hỏi kỹ thuật liên quan đến phát triển web, lập trình và công nghệ.

Tính cách:
- Thân thiện, khuyến khích và kiên nhẫn.
- Sử dụng emoji thỉnh thoảng để giữ cho cuộc trò chuyện hấp dẫn 😊
- Giữ cho câu trả lời ngắn gọn, trực diện, không lan man nhưng đầy đủ ý và hữu ích.
- Trình bày thông tin rõ ràng bằng các gạch đầu dòng hoặc in đậm để dễ đọc.
- Nếu người dùng hỏi về khóa học, hãy giới thiệu các khóa học cụ thể có trong hệ thống nếu phù hợp.
- Nếu bạn không biết điều gì đó, hãy trung thực thông báo.
- Luôn khuyến khích học tập liên tục.

Ưu tiên trả lời bằng chính ngôn ngữ mà người dùng sử dụng (nếu bằng tiếng Việt, hãy đáp lại bằng tiếng Việt).`;

export async function POST(request: NextRequest) {

    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, CHATBOT_RATE_LIMIT);
    if (!rateLimit.success) {
        return NextResponse.json(
            {
                success: false,
                error: `Bạn đang gửi tin nhắn quá nhanh. Thử lại sau ${rateLimit.retryAfter} giây.`,
                errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED,
            },
            { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
        );
    }

    try {
        const { messages } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file." },
                { status: 500 }
            );
        }

        // Generate dynamic course list
        let dynamicContext = "";
        try {
            const [coursesRows] = await db.execute<any[]>(
                `SELECT c.id, c.title, c.description, c.price, c.level, c.type, cat.name as category_name
                 FROM courses c
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 WHERE c.published = 1 LIMIT 20`
            );

            if (coursesRows && coursesRows.length > 0) {
                dynamicContext = "\n\nDanh sách các khóa học hiện đang có sẵn trên hệ thống EduLearn:\n";
                coursesRows.forEach((course, index) => {
                    const priceText = course.type === "FREE" || Number(course.price) === 0 ? "Miễn phí" : `${Number(course.price).toLocaleString()} VNĐ`;
                    const descriptionSnippet = course.description ? course.description.substring(0, 150) + "..." : "";
                    dynamicContext += `${index + 1}. **[${course.title}](/courses/${course.id})**\n   - Danh mục: ${course.category_name || 'Chưa phân loại'}\n   - Trình độ: ${course.level}\n   - Giá: ${priceText}\n   - Mô tả ngắn: ${descriptionSnippet}\n`;
                });

                dynamicContext += "\nKhi giới thiệu khóa học cho sinh viên, hãy luôn sử dụng cú pháp link như trên để sinh viên có thể click thẳng vào khóa học: ví dụ [Tên Khóa Học](/courses/d3f2...).";
            } else {
                dynamicContext = "\n\nHiện tại chưa có khóa học nào được xuất bản trên hệ thống.";
            }
        } catch (dbError) {
            console.error("Failed to fetch courses for bot context:", dbError);
        }

        const FINAL_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + dynamicContext;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: FINAL_SYSTEM_PROMPT,
        });

        // Get logged-in user (optional - chat works without login too)
        const user = await getAuthUser();

        // Convert messages to Gemini format
        // Expected inputs: array of { role: "user" | "model", parts: [{ text: "..." }] }
        // Incoming format: [{ role: "user" | "assistant" | "system", content: "..." }]
        const history = messages
            .filter((msg: any) => msg.role !== "system")
            .map((msg: any) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content || "" }]
            }));

        const lastMessage = history.pop();

        if (!lastMessage || lastMessage.role !== "user") {
            return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
        }

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(lastMessage.parts[0].text);
        const reply = result.response.text() || "Xin lỗi, tôi không thể tạo câu trả lời.";

        // Save to DB if user is logged in
        if (user) {
            try {
                // Save user message
                await db.execute<ResultSetHeader>(
                    "INSERT INTO chat_messages (id, role, content, user_id) VALUES (?, 'USER', ?, ?)",
                    [crypto.randomUUID(), lastMessage.parts[0].text, user.id]
                );
                // Save AI response
                await db.execute<ResultSetHeader>(
                    "INSERT INTO chat_messages (id, role, content, user_id) VALUES (?, 'ASSISTANT', ?, ?)",
                    [crypto.randomUUID(), reply, user.id]
                );
            } catch (dbError) {
                console.error("Failed to save chat to DB:", dbError);
                // Don't fail the response if DB save fails
            }
        }

        return NextResponse.json({ message: reply });
    } catch (error: unknown) {
        // ✅ Centralized error handler — ported from YoloHub's errorHandler
        const err = error as { status?: number; message?: string };
        if (err.status === 401 || err.message?.includes("API key")) {
            return NextResponse.json(
                { success: false, error: "API key không hợp lệ. Vui lòng kiểm tra GEMINI_API_KEY." },
                { status: 401 }
            );
        }
        if (err.status === 429) {
            return NextResponse.json(
                { success: false, error: "Gemini API quá tải. Thử lại sau ít phút." },
                { status: 429 }
            );
        }
        return handleApiError(error);
    }
}

