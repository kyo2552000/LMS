import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import db from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Bạn là EduBot, trợ lý học tập AI thông minh cho nền tảng học tập trực tuyến EduLearn. 

Vai trò của bạn:
- Giúp sinh viên tìm các khóa học phù hợp với mục tiêu học tập của họ
- Trả lời các câu hỏi về nội dung khóa học, trình độ và yêu cầu
- Cung cấp mẹo học tập, chiến lược học tập và động lực
- Giải thích các khái niệm phức tạp một cách đơn giản
- Đề xuất lộ trình học tập dựa trên sở thích của sinh viên
- Giúp đỡ các câu hỏi kỹ thuật liên quan đến phát triển web, lập trình và công nghệ

Tính cách:
- Thân thiện, khuyến khích và kiên nhẫn
- Sử dụng emoji thỉnh thoảng để giữ cho cuộc trò chuyện hấp dẫn 😊
- Giữ cho câu trả lời ngắn gọn nhưng hữu ích (tối đa 2-4 đoạn)
- Nếu bạn không biết điều gì đó, hãy trung thực về điều đó
- Luôn khuyến khích học tập liên tục

Các khóa học có sẵn trên EduLearn:
1. Web Development Bootcamp - Phát triển web full-stack với HTML, CSS, JavaScript, React, Node.js
2. Python for Data Science - Phân tích dữ liệu, trực quan hóa, học máy với Python
3. UI/UX Design Fundamentals - Nguyên tắc thiết kế giao diện và trải nghiệm người dùng
4. Mobile App Development - Xây dựng ứng dụng iOS và Android với React Native
5. Cloud Computing & DevOps - AWS, Docker, Kubernetes, CI/CD
6. Cybersecurity Essentials - Bảo mật mạng, hack mũ trắng, thực tiễn bảo mật

Respond in the same language the user uses. If they write in Vietnamese, respond in Vietnamese.`;

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file." },
                { status: 500 }
            );
        }

        // Get logged-in user (optional - chat works without login too)
        const user = await getAuthUser();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

        // Save to DB if user is logged in
        if (user) {
            try {
                const lastUserMsg = messages[messages.length - 1];
                if (lastUserMsg && lastUserMsg.role === "user") {
                    // Save user message
                    await db.execute<ResultSetHeader>(
                        "INSERT INTO chat_messages (id, role, content, user_id) VALUES (?, 'USER', ?, ?)",
                        [crypto.randomUUID(), lastUserMsg.content, user.id]
                    );
                }
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
        console.error("Chat API Error:", error);

        if (error instanceof OpenAI.APIError) {
            if (error.status === 401) {
                return NextResponse.json(
                    { error: "Invalid API key. Please check your OPENAI_API_KEY." },
                    { status: 401 }
                );
            }
            if (error.status === 429) {
                return NextResponse.json(
                    { error: "Rate limit exceeded. Please try again in a moment." },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: "An error occurred while processing your request." },
            { status: 500 }
        );
    }
}

