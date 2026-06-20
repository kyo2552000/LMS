import fs from "fs";
import path from "path";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

function h(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level });
}

function p(...runs) {
  return new Paragraph({
    children: runs.map((r) =>
      typeof r === "string" ? new TextRun({ text: r }) : r
    ),
  });
}

function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 } });
}

function codeLine(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas" })],
  });
}

async function main() {
  const primary = path.join(process.cwd(), "EDULEARN_HuongDan_BaoVeDoAn.docx");
  const fallback = path.join(
    process.cwd(),
    "EDULEARN_HuongDan_BaoVeDoAn_5PHUT.docx"
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          h("EduLearn — Hướng dẫn bảo vệ đồ án", HeadingLevel.TITLE),
          p(
            new TextRun({
              text: "Phiên bản dự án: Next.js + MySQL, có các phân hệ: User / Instructor / Admin, thanh toán QR, chatbot AI (Gemini).",
            })
          ),
          p(
            new TextRun({
              text: "Mục tiêu tài liệu: kịch bản thuyết trình 5 phút; phần chi tiết và Q&A tập trung vào Chatbot AI và chức năng học trực tuyến (thầy cô thường hỏi sâu hai mảng này).",
            })
          ),

          h("1) Công nghệ & kiến trúc tổng quan", HeadingLevel.HEADING_1),
          bullet("Frontend + Backend trong cùng một dự án Next.js (App Router)."),
          bullet("UI: React 18, Tailwind CSS, Radix UI, lucide-react icons."),
          bullet("Backend: Next.js Route Handlers (`app/api/**/route.ts`)."),
          bullet("Database: MySQL (mysql2/promise) — kết nối qua `lib/db.ts`."),
          bullet("Auth: JWT cookie (`auth_token`) — helpers ở `lib/auth.ts`."),
          bullet("Validation: Zod — schemas ở `lib/validation.ts`."),
          bullet("AI Chatbot: Google Gemini (`@google/generative-ai`)."),

          h("2) Cấu trúc thư mục quan trọng", HeadingLevel.HEADING_1),
          bullet("`app/`: Pages (UI) + API routes."),
          bullet("`components/`: React components tái sử dụng."),
          bullet("`lib/`: logic dùng chung (db, auth, error, rate-limit, validation...)."),
          bullet("`sql/`: init DB, seed dữ liệu, migrate scripts."),
          bullet("`public/uploads/`: nơi lưu file upload (video/ảnh/tài liệu)."),

          h("3) Database (MySQL) — các bảng chính", HeadingLevel.HEADING_1),
          p(
            "DB được tạo bởi `sql/init.sql` và chạy bằng script `npm run db:init` hoặc `npm run db:setup`."
          ),
          bullet("`users`: tài khoản, role (STUDENT/INSTRUCTOR/ADMIN), status."),
          bullet("`roles`, `permissions`, `role_permissions`: hệ phân quyền mở rộng."),
          bullet("`categories`, `courses`, `lessons`: nội dung học tập."),
          bullet("`enrollments`: ghi danh (user đã mua/được cấp quyền học)."),
          bullet("`lesson_progress`: tiến độ học theo bài."),
          bullet("`orders`: đơn hàng (PENDING/PAID/...)."),
          bullet("`coupons`, `coupon_usage`: mã giảm giá."),
          bullet("`reviews`: đánh giá khoá học."),
          bullet("`comments`: bình luận bài học/khoá học."),
          bullet("`chat_messages`: lịch sử chatbot theo user."),

          h("4) Luồng đăng nhập (JWT cookie)", HeadingLevel.HEADING_1),
          p(
            new TextRun({
              text: "API login: `POST /api/auth/login` → kiểm tra rate limit + validate input + bcrypt compare → tạo JWT → set cookie `auth_token`.",
            })
          ),
          bullet("Client giữ trạng thái user ở `components/AuthProvider.tsx` (fetch `/api/auth/me`)."),
          bullet("API cần đăng nhập gọi `getAuthUser()` trong `lib/auth.ts`."),

          h("5) Luồng xem khoá học & học bài (tóm tắt)", HeadingLevel.HEADING_1),
          bullet("Trang `/` lấy khóa học nổi bật (server component) và categories từ MySQL."),
          bullet("Trang `/courses` gọi `GET /api/courses` (lọc category/search/level/type/sort)."),
          bullet("Trang chi tiết `/courses/[id]`: hiển thị info khoá học + bài học."),
          bullet("Trang học `/courses/[id]/learn`: theo loại bài (VIDEO / QUIZ / TEXT / tài liệu DOCX)."),

          h("5b) Chức năng học trực tuyến — chi tiết (để trả lời thầy cô)", HeadingLevel.HEADING_1),
          p("File chính: `app/courses/[id]/learn/page.tsx` (client component)."),
          bullet("Điều kiện vào học: gọi `GET /api/courses/[id]`; nếu `isEnrolled === false` thì chuyển về trang chi tiết khóa học (chưa ghi danh thì không vào được trang learn)."),
          bullet("Danh sách bài học: sidebar, có tìm kiếm theo tên bài; URL có query `?lesson=<id>` để chia sẻ đúng bài đang học."),
          bullet("VIDEO — file trên server (`/api/media?file=...`): dùng thẻ `<video>`, lưu vị trí xem trong localStorage (tiếp tục xem), thanh % xem; đồng bộ tiến độ lên server qua `POST /api/lesson-progress`."),
          bullet("VIDEO — YouTube / URL ngoài: nhúng bằng `<iframe>` (embed)."),
          bullet("Tự động đánh dấu hoàn thành video: khi `watchPercent >= 80%` hệ thống gọi đánh dấu hoàn thành bài (tránh phải bấm tay)."),
          bullet("QUIZ: component `TakeQuiz`; sau khi làm xong có thể cập nhật tiến độ tương tự các loại bài khác (tùy luồng trong component)."),
          bullet("TEXT / ASSIGNMENT: hiển thị nội dung text hoặc tài liệu theo trường lesson."),
          bullet("DOCX: component `DocxViewer` gọi `GET /api/parse-docx?url=...` — server dùng thư viện mammoth chuyển DOCX → HTML để hiển thị trong trang; có nút tải file gốc."),
          bullet("Tiến độ & chứng chỉ: `POST /api/lesson-progress` (Zod validate) cập nhật bảng `lesson_progress`; sau đó tính % hoàn thành khóa và `UPDATE enrollments` (progress, status ACTIVE/COMPLETED, completed_at). Khi đủ 100% bài, UI gợi ý mở `/courses/[id]/certificate`."),
          bullet("Bình luận theo bài: `components/LessonComments.tsx` gắn với lesson/course (tương tác xã hội trong học tập)."),

          h("6) Luồng thanh toán & ghi danh", HeadingLevel.HEADING_1),
          p(
            new TextRun({
              text: "`POST /api/orders` tạo đơn: dùng transaction, kiểm tra đã mua chưa, áp coupon, tạo order PENDING hoặc PAID.",
            })
          ),
          bullet("Nếu tổng tiền sau giảm giá = 0 → order PAID và auto-enroll."),
          bullet("Nếu PENDING → UI `/checkout` hiển thị QR để thanh toán, admin duyệt đơn trên trang admin orders."),

          h("7) Upload & phục vụ file (ảnh/video/tài liệu)", HeadingLevel.HEADING_1),
          bullet("`POST /api/upload`: chỉ ADMIN, rate limit, giới hạn dung lượng, lưu vào `public/uploads/*`."),
          bullet("Trả URL dạng `/api/media?file=...` để đọc file."),
          bullet("Bài học có thể gắn `video_url` hoặc `docx_url` trong bảng `lessons`."),

          h("8) Admin panel & Instructor panel", HeadingLevel.HEADING_1),
          bullet("Admin pages nằm ở `app/admin/*` (layout kiểm tra role ADMIN)."),
          bullet("API tổng quát CRUD: `app/api/admin/[table]/route.ts` (whitelist bảng + checkRole)."),
          bullet("Instructor pages nằm ở `app/instructor/*` (tạo/sửa khoá học và bài giảng)."),

          h("9) Chatbot AI (Gemini) — chi tiết (để trả lời thầy cô)", HeadingLevel.HEADING_1),
          p("File API: `app/api/chat/route.ts`. Giao diện: `components/ChatBot.tsx` (widget nổi toàn site, gửi `messages` lên API)."),
          bullet("Mô hình: Google Generative AI, model `gemini-2.5-flash`, package `@google/generative-ai`."),
          bullet("Biến môi trường bắt buộc: `GEMINI_API_KEY` trong `.env.local` — nếu thiếu API trả 500 và báo cần cấu hình."),
          bullet("System prompt: hằng số `BASE_SYSTEM_PROMPT` định nghĩa vai trò EduBot (tư vấn khóa học, mẹo học tập, trả lời tiếng Việt nếu user dùng tiếng Việt)."),
          bullet("Context động: trước mỗi phiên chat, server query MySQL lấy tối đa 20 khóa học `published = 1` (title, mô tả rút gọn, giá, level, danh mục) và nối vào prompt — giúp bot giới thiệu khóa thật trên hệ thống, kèm cú pháp link markdown `/courses/{id}`."),
          bullet("Rate limit: `CHATBOT_RATE_LIMIT` trong `lib/rate-limit.ts` — 20 tin nhắn / 1 phút / IP (tránh spam API và chi phí)."),
          bullet("Định dạng hội thoại gửi lên: mảng `{ role: user|assistant, content }`; API map `assistant` → role `model` của Gemini, dùng `startChat({ history })` + `sendMessage` cho tin cuối."),
          bullet("Lưu DB: nếu user đã đăng nhập (`getAuthUser()`), sau khi có câu trả lời thì INSERT 2 dòng vào `chat_messages` (USER + ASSISTANT). Nếu lưu DB lỗi thì vẫn trả lời user (không làm hỏng trải nghiệm)."),
          bullet("Không bắt buộc đăng nhập để chat: code ghi chú optional user — visitor vẫn dùng bot nhưng không lưu lịch sử."),
          bullet("UI: quick prompts, Enter gửi tin, hiển thị loading; lỗi mạng/API hiển thị trong khung chat."),

          h("10) Các lệnh chạy dự án (demo khi bảo vệ)", HeadingLevel.HEADING_1),
          p("Thiết lập DB (lần đầu):"),
          codeLine("npm install"),
          codeLine("npm run db:init"),
          p("Chạy dự án:"),
          codeLine("npm run dev"),
          p("Build & chạy production:"),
          codeLine("npm run build"),
          codeLine("npm run start"),

          h("11) Kịch bản thuyết trình 5 phút (chia theo thời gian)", HeadingLevel.HEADING_1),
          bullet("0:00–0:45 — Mở đầu: EduLearn là nền tảng học trực tuyến (Next.js + MySQL), hỗ trợ học viên xem khóa học, học đa định dạng (video, quiz, tài liệu), và chatbot AI tư vấn khóa học."),
          bullet("0:45–2:00 — Demo học trực tuyến (ưu tiên màn `/courses/[id]/learn`): vào khóa đã ghi danh → chọn bài VIDEO (tiến độ %, tiếp tục xem) hoặc bài DOCX (xem HTML) / QUIZ → nhấn mạnh API `lesson-progress` cập nhật `lesson_progress` và `enrollments`, khi đủ bài thì có chứng chỉ."),
          bullet("2:00–3:15 — Demo chatbot: mở widget → hỏi “có khóa học gì?” — bot trả lời dựa trên danh sách khóa thật trong DB; nói ngắn: Gemini + prompt + RAG nhẹ (context khóa học), rate limit, lưu lịch sử khi đã login."),
          bullet("3:15–4:15 — Kiến trúc 1 slide hoặc lời nói: App Router, `app/api/*` xử lý nghiệp vụ, JWT cookie, bảng `lessons` / `lesson_progress` / `chat_messages`."),
          bullet("4:15–5:00 — Kết luận: đã đáp ứng học online đa phương tiện + hỗ trợ AI; hướng phát triển: streaming chuyên sâu, payment tự động, fine-tune hoặc embedding lớn hơn cho bot."),

          h("12) Câu hỏi dự kiến — Chatbot", HeadingLevel.HEADING_1),
          bullet("Hỏi: Bot dùng mô hình gì? — Đáp: Google Gemini (`gemini-2.5-flash`) qua SDK `@google/generative-ai`, API key trong env."),
          bullet("Hỏi: Làm sao bot biết khóa học của trang mình? — Đáp: Mỗi request chat, server query MySQL các khóa `published` và ghép vào system instruction; không phải huấn luyện riêng model."),
          bullet("Hỏi: Có RAG không? — Đáp: Đây là “context injection” đơn giản (danh sách khóa cố định trong prompt). Có thể mở rộng RAG với vector DB sau này."),
          bullet("Hỏi: Rate limit để làm gì? — Đáp: Giới hạn 20 request/phút/IP để tránh lạm dụng và bảo vệ quota API."),
          bullet("Hỏi: Lịch sử chat lưu ở đâu? — Đáp: Bảng `chat_messages` (role USER/ASSISTANT, `user_id`), chỉ khi user đã đăng nhập."),
          bullet("Hỏi: User chưa đăng nhập có chat được không? — Đáp: Có, API vẫn gọi Gemini; chỉ không lưu DB."),

          h("13) Câu hỏi dự kiến — Học trực tuyến", HeadingLevel.HEADING_1),
          bullet("Hỏi: Làm sao biết học viên đã học đến đâu? — Đáp: Bảng `lesson_progress` (completed, watch_percent, last_position); video local còn cache vị trí trong localStorage để UX mượt."),
          bullet("Hỏi: Tiến độ khóa học tính thế nào? — Đáp: Số bài đã `completed` / tổng số bài; cập nhật vào `enrollments.progress` và đổi `status` thành COMPLETED khi đủ."),
          bullet("Hỏi: Tại sao có cả video upload và YouTube? — Đáp: Linh hoạt nội dung — file nội bộ qua `/api/media`, link ngoài nhúng iframe."),
          bullet("Hỏi: DOCX hiển thị thế nào? — Đáp: Server parse DOCX → HTML (`mammoth`) tại `/api/parse-docx`, client render HTML an toàn trong khung học tập."),
          bullet("Hỏi: Ai được vào trang học? — Đáp: Chỉ khi API course trả `isEnrolled` (đã mua / được ghi danh); không thì redirect về trang chi tiết khóa."),
          bullet("Hỏi: Chứng chỉ khi nào có? — Đáp: Khi hoàn thành toàn bộ bài (logic trên UI khi progress 100%), có route certificate."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  let outPath = primary;
  try {
    fs.writeFileSync(primary, buffer);
  } catch (e) {
    if (e && e.code === "EBUSY") {
      fs.writeFileSync(fallback, buffer);
      outPath = fallback;
      // eslint-disable-next-line no-console
      console.warn(
        "⚠️ File gốc đang mở (Word). Đã ghi bản sao:",
        fallback
      );
    } else {
      throw e;
    }
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Generated: ${outPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Failed to generate docx:", err);
  process.exit(1);
});

