import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_IN = path.join(ROOT, "Báo cáo 2.docx");
const DOC_OUT = path.join(ROOT, "Báo cáo 2 (có cơ sở lý thuyết).docx");

// ===== XML HELPERS =====
function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

function paragraphText(paragraphXml) {
  return [...paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((m) => decodeXml(m[1]))
    .join("")
    .trim();
}

// Tạo đoạn văn kiểu Heading 2 (mục con chương)
function heading2(text) {
  return `<w:p>
    <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
    <w:r><w:t xml:space="preserve">${escXml(text)}</w:t></w:r>
  </w:p>`;
}

// Tạo đoạn văn kiểu Heading 3 (mục con nhỏ)
function heading3(text) {
  return `<w:p>
    <w:pPr><w:pStyle w:val="Heading3"/></w:pPr>
    <w:r><w:t xml:space="preserve">${escXml(text)}</w:t></w:r>
  </w:p>`;
}

// Tạo đoạn văn thường, có thể in đậm một phần
function para(text, bold = false) {
  const rPr = bold ? "<w:rPr><w:b/><w:bCs/></w:rPr>" : "";
  return `<w:p>
    <w:pPr><w:jc w:val="both"/></w:pPr>
    <w:r>${rPr}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>
  </w:p>`;
}

// Tạo đoạn trống
function emptyPara() {
  return `<w:p><w:pPr/></w:p>`;
}

// ===== NỘI DUNG CƠ SỞ LÝ THUYẾT =====
function buildTheorySection() {
  const blocks = [];

  // --- 1.X: Tổng quan về hệ thống E-Learning ---
  blocks.push(heading2("1.2. Cơ sở lý thuyết"));
  blocks.push(emptyPara());

  blocks.push(heading3("1.2.1. Tổng quan về hệ thống E-Learning"));
  blocks.push(para(
    "E-Learning (Electronic Learning) là hình thức học tập trực tuyến thông qua các thiết bị điện tử và mạng Internet, cho phép người học tiếp cận nội dung giáo dục mọi lúc, mọi nơi mà không bị giới hạn bởi không gian và thời gian. Theo định nghĩa của UNESCO, e-learning là việc sử dụng các công nghệ thông tin và truyền thông để hỗ trợ và nâng cao chất lượng giảng dạy và học tập."
  ));
  blocks.push(emptyPara());
  blocks.push(para(
    "Một hệ thống E-Learning hoàn chỉnh (Learning Management System – LMS) thường bao gồm các thành phần cốt lõi sau:"
  ));
  blocks.push(para("- Quản lý người dùng (User Management): Phân quyền và quản lý tài khoản học viên, giảng viên, quản trị viên."));
  blocks.push(para("- Quản lý nội dung (Content Management): Tạo, lưu trữ và phân phối bài giảng dưới dạng video, tài liệu, quiz."));
  blocks.push(para("- Theo dõi tiến độ (Progress Tracking): Ghi nhận quá trình học tập, tỷ lệ hoàn thành của từng học viên."));
  blocks.push(para("- Đánh giá và kiểm tra (Assessment): Bài kiểm tra, quiz tương tác để đo lường kết quả học tập."));
  blocks.push(para("- Thanh toán trực tuyến (Payment): Hỗ trợ đăng ký và thanh toán khóa học trực tuyến."));
  blocks.push(para("- Tương tác và phản hồi (Interaction): Bình luận, đánh giá khóa học, chatbot hỗ trợ học tập."));
  blocks.push(emptyPara());

  blocks.push(para(
    "Hệ thống EDULearn được xây dựng theo mô hình LMS hiện đại, kết hợp đầy đủ các thành phần trên, đồng thời tích hợp thêm trí tuệ nhân tạo (AI Chatbot) để nâng cao trải nghiệm người dùng."
  ));
  blocks.push(emptyPara());

  // --- 1.X: Kiến trúc hệ thống Web hiện đại ---
  blocks.push(heading3("1.2.2. Kiến trúc hệ thống Web ứng dụng 3 lớp"));
  blocks.push(para(
    "Hệ thống EDULearn được thiết kế theo mô hình kiến trúc 3 lớp (Three-Tier Architecture) – một trong những mô hình phổ biến và được ưa chuộng nhất trong phát triển ứng dụng web hiện đại:"
  ));
  blocks.push(para("- Lớp trình bày (Presentation Layer): Giao diện người dùng, xây dựng bằng React (Next.js), chịu trách nhiệm hiển thị thông tin và nhận tương tác từ người dùng."));
  blocks.push(para("- Lớp xử lý nghiệp vụ (Business Logic Layer): Các API Routes trong Next.js xử lý logic nghiệp vụ như xác thực, phân quyền, quản lý đơn hàng, ghi danh."));
  blocks.push(para("- Lớp dữ liệu (Data Layer): Cơ sở dữ liệu MySQL lưu trữ toàn bộ thông tin hệ thống với 16 bảng dữ liệu quan hệ."));
  blocks.push(emptyPara());

  // --- 1.X: Next.js ---
  blocks.push(heading3("1.2.3. Framework Next.js"));
  blocks.push(para(
    "Next.js là một framework React mã nguồn mở được phát triển bởi Vercel, cung cấp môi trường phát triển full-stack hiệu suất cao cho các ứng dụng web. Dự án EDULearn sử dụng Next.js phiên bản 16 với App Router – mô hình định tuyến mới nhất dựa trên cấu trúc thư mục."
  ));
  blocks.push(emptyPara());
  blocks.push(para("Các tính năng nổi bật của Next.js được áp dụng trong EDULearn:"));
  blocks.push(para(
    "- App Router & File-based Routing: Hệ thống định tuyến dựa trên cấu trúc thư mục app/, mỗi thư mục tương ứng với một route (ví dụ: app/courses/[id]/page.tsx → /courses/:id). Dự án có 15 trang người dùng và 14 trang quản trị admin."
  ));
  blocks.push(para(
    "- API Routes: Next.js cho phép xây dựng backend API ngay trong cùng dự án tại app/api/. EDULearn có 27 API endpoint xử lý toàn bộ nghiệp vụ: khóa học, đơn hàng, xác thực, chatbot AI, upload file."
  ));
  blocks.push(para(
    "- Server-Side Rendering (SSR) & Static Site Generation (SSG): Tối ưu hóa hiệu suất tải trang và SEO, đặc biệt quan trọng cho trang danh sách khóa học và chi tiết khóa học."
  ));
  blocks.push(para(
    "- TypeScript Support: Next.js tích hợp sẵn TypeScript, giúp phát hiện lỗi sớm trong quá trình phát triển. Toàn bộ codebase EDULearn sử dụng TypeScript (.tsx, .ts)."
  ));
  blocks.push(para(
    "- Image Optimization: Component next/image tự động tối ưu hóa hình ảnh khóa học, giảm thời gian tải trang."
  ));
  blocks.push(emptyPara());

  // --- 1.X: React & TypeScript ---
  blocks.push(heading3("1.2.4. React và TypeScript"));
  blocks.push(para(
    "React là thư viện JavaScript mã nguồn mở do Meta phát triển, cho phép xây dựng giao diện người dùng theo hướng component-based. Mỗi thành phần UI trong EDULearn (CourseCard, Navbar, ChatBot, AdminTable...) là một React component độc lập, có thể tái sử dụng."
  ));
  blocks.push(para(
    "TypeScript là ngôn ngữ lập trình mở rộng của JavaScript, bổ sung hệ thống kiểu tĩnh (static typing) giúp phát hiện lỗi trong quá trình viết code thay vì khi chạy. Trong EDULearn, TypeScript được sử dụng để định nghĩa các interface như Course, User, Lesson, Order trong file types/index.ts, đảm bảo tính nhất quán dữ liệu xuyên suốt ứng dụng."
  ));
  blocks.push(emptyPara());

  // --- 1.X: TailwindCSS ---
  blocks.push(heading3("1.2.5. TailwindCSS"));
  blocks.push(para(
    "TailwindCSS là framework CSS theo hướng utility-first, cho phép xây dựng giao diện trực tiếp trong markup bằng các class tiện ích như flex, grid, text-blue-600, rounded-xl. EDULearn sử dụng TailwindCSS phiên bản 3.4 để thiết kế giao diện responsive, hỗ trợ đầy đủ Dark Mode và các hiệu ứng animation. Cấu hình tùy chỉnh được định nghĩa trong tailwind.config.ts."
  ));
  blocks.push(emptyPara());

  // --- 1.X: MySQL ---
  blocks.push(heading3("1.2.6. Hệ quản trị cơ sở dữ liệu MySQL"));
  blocks.push(para(
    "MySQL là hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở phổ biến nhất thế giới, sử dụng ngôn ngữ SQL (Structured Query Language) để quản lý dữ liệu. MySQL được lựa chọn cho EDULearn vì các lý do sau:"
  ));
  blocks.push(para("- Dữ liệu có cấu trúc quan hệ chặt chẽ: Các thực thể Users, Courses, Lessons, Enrollments, Orders có mối quan hệ 1-nhiều và nhiều-nhiều rõ ràng, phù hợp với mô hình quan hệ."));
  blocks.push(para("- ACID Compliance: Đảm bảo tính toàn vẹn dữ liệu giao dịch (Atomicity, Consistency, Isolation, Durability), đặc biệt quan trọng trong luồng thanh toán và ghi danh."));
  blocks.push(para("- Foreign Key Constraints: Ràng buộc khóa ngoại với ON DELETE CASCADE đảm bảo tính nhất quán khi xóa dữ liệu (ví dụ: xóa khóa học sẽ tự động xóa bài giảng, ghi danh liên quan)."));
  blocks.push(para("- Hiệu suất với Index: Sử dụng INDEX trên các cột thường xuyên truy vấn (user_id, course_id, category_id) để tối ưu tốc độ."));
  blocks.push(para("- Thư viện mysql2/promise: Kết nối MySQL từ Node.js thông qua Connection Pool, hỗ trợ async/await và prepared statements chống SQL Injection."));
  blocks.push(emptyPara());

  blocks.push(para("Cơ sở dữ liệu EDULearn (database: edulearn) gồm 16 bảng chính:"));
  blocks.push(para("- users: Lưu thông tin người dùng với 3 vai trò STUDENT, INSTRUCTOR, ADMIN."));
  blocks.push(para("- roles, permissions, role_permissions: Hệ thống phân quyền linh hoạt."));
  blocks.push(para("- categories: Danh mục khóa học (Lập trình, Thiết kế, Ngoại ngữ...)."));
  blocks.push(para("- courses: Thông tin khóa học (tiêu đề, mô tả, giá, cấp độ, loại FREE/PAID)."));
  blocks.push(para("- lessons: Bài giảng (video_url, docx_url, nội dung quiz)."));
  blocks.push(para("- enrollments: Ghi danh học viên vào khóa học, theo dõi tiến độ (%)."));
  blocks.push(para("- lesson_progress: Trạng thái hoàn thành từng bài học."));
  blocks.push(para("- orders: Đơn hàng thanh toán với các trạng thái PENDING/PAID/CANCELLED."));
  blocks.push(para("- reviews, comments: Đánh giá và bình luận khóa học."));
  blocks.push(para("- favorites: Danh sách khóa học yêu thích của người dùng."));
  blocks.push(para("- coupons, coupon_usage: Quản lý mã giảm giá."));
  blocks.push(para("- chat_messages: Lịch sử hội thoại với AI Chatbot."));
  blocks.push(emptyPara());

  // --- 1.X: Xác thực và Bảo mật ---
  blocks.push(heading3("1.2.7. Xác thực và Bảo mật hệ thống"));
  blocks.push(para(
    "Hệ thống EDULearn áp dụng các cơ chế bảo mật hiện đại:"
  ));
  blocks.push(para(
    "- JWT (JSON Web Token): Sau khi đăng nhập thành công, hệ thống tạo JWT và lưu vào HTTP-only cookie. Mỗi request đến API đều được xác thực thông qua hàm getAuthUser() trong lib/auth.ts, đọc và giải mã JWT từ cookie."
  ));
  blocks.push(para(
    "- bcryptjs: Mật khẩu người dùng được mã hóa một chiều bằng bcrypt với salt rounds = 10 trước khi lưu vào database, đảm bảo an toàn ngay cả khi database bị rò rỉ."
  ));
  blocks.push(para(
    "- Phân quyền theo vai trò (RBAC): Các API endpoint trong khu vực /api/admin/ kiểm tra vai trò ADMIN trước khi xử lý request. Giao diện admin (app/admin/) kiểm tra quyền ngay tại layout.tsx."
  ));
  blocks.push(para(
    "- Prepared Statements: Toàn bộ truy vấn MySQL sử dụng tham số hóa (parameterized queries) qua db.execute(SQL, [params]) để ngăn chặn SQL Injection."
  ));
  blocks.push(emptyPara());

  // --- 1.X: AI Chatbot ---
  blocks.push(heading3("1.2.8. Tích hợp trí tuệ nhân tạo (AI Chatbot)"));
  blocks.push(para(
    "EDULearn tích hợp Google Gemini API (thư viện @google/generative-ai) để xây dựng chatbot học tập thông minh EduBot. Chatbot hoạt động theo luồng: người dùng gửi câu hỏi → API Route /api/chat nhận request → gọi Gemini API với ngữ cảnh hệ thống phù hợp → trả về câu trả lời. Lịch sử hội thoại được lưu vào bảng chat_messages trong MySQL, cho phép truy vấn lại. Đây là một trong những tính năng nâng cao phân biệt EDULearn với các LMS truyền thống."
  ));
  blocks.push(emptyPara());

  // --- 1.X: Luồng nghiệp vụ thanh toán ---
  blocks.push(heading3("1.2.9. Luồng nghiệp vụ thanh toán và ghi danh"));
  blocks.push(para(
    "Hệ thống thanh toán EDULearn được thiết kế theo luồng xác nhận thủ công kết hợp VietQR:"
  ));
  blocks.push(para("Bước 1: Học viên chọn khóa học và tiến hành thanh toán tại /checkout, hệ thống tạo đơn hàng (status = PENDING) trong bảng orders."));
  blocks.push(para("Bước 2: Học viên quét mã VietQR và thực hiện chuyển khoản ngân hàng."));
  blocks.push(para("Bước 3: Admin xác nhận thanh toán tại /admin/orders, cập nhật status = PAID."));
  blocks.push(para("Bước 4: Hệ thống tự động tạo bản ghi trong bảng enrollments, cấp quyền truy cập khóa học cho học viên."));
  blocks.push(para("Bước 5: Học viên truy cập học tại /courses/:id/learn, tiến độ được ghi nhận realtime vào lesson_progress."));
  blocks.push(emptyPara());

  return blocks.join("\n");
}

// ===== MAIN =====
async function main() {
  if (!fs.existsSync(DOC_IN)) {
    throw new Error(`Không tìm thấy file: ${DOC_IN}`);
  }

  console.log("Đang đọc file:", DOC_IN);
  const zip = await JSZip.loadAsync(fs.readFileSync(DOC_IN));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Không tìm thấy word/document.xml");
  let xml = await docFile.async("string");

  // Tách các đoạn văn
  const paragraphRegex = /<w:p[\s\S]*?<\/w:p>/g;
  const paragraphs = [...xml.matchAll(paragraphRegex)].map((m) => m[0]);

  console.log(`Tổng số đoạn văn: ${paragraphs.length}`);

  // Tìm vị trí Chương 1 (Heading2 style) và điểm bắt đầu chương tiếp theo
  let ch1Idx = -1;
  let endOfCh1Idx = -1; // Đoạn cuối cùng thuộc Chương 1 (trước khi mục 2.x xuất hiện)

  for (let i = 0; i < paragraphs.length; i++) {
    const t = paragraphText(paragraphs[i]);
    const style = (paragraphs[i].match(/w:pStyle w:val="([^"]+)"/) || [])[1] || "";

    // Tìm tiêu đề CHƯƠNG 1
    if (ch1Idx === -1 && style === "Heading2" && t.includes("CHƯƠNG 1")) {
      ch1Idx = i;
      console.log(`✅ Tìm thấy CHƯƠNG 1 tại đoạn ${i}: "${t.substring(0, 80)}"`);
    }

    // Sau khi tìm thấy Chương 1, tìm tiêu đề Heading3 là "2.1." (bắt đầu nội dung chương 2)
    if (ch1Idx !== -1 && endOfCh1Idx === -1) {
      // Dừng khi gặp mục bắt đầu bằng "2." trong Heading3
      if (style === "Heading3" && /^2\.\d/.test(t)) {
        endOfCh1Idx = i - 1; // Chèn trước đoạn này
        console.log(`✅ Tìm thấy điểm kết thúc Chương 1 tại đoạn ${i}: "${t.substring(0, 80)}"`);
        break;
      }
    }
  }

  // Xác định vị trí chèn: sau mục 1.8 cuối cùng (trước 2.1)
  let insertAfterIdx;
  if (ch1Idx !== -1 && endOfCh1Idx !== -1) {
    // Tìm mục 1.x cuối cùng (Heading3) trong phạm vi Chương 1
    let lastSec1Idx = ch1Idx;
    for (let i = ch1Idx + 1; i <= endOfCh1Idx; i++) {
      const t = paragraphText(paragraphs[i]);
      const style = (paragraphs[i].match(/w:pStyle w:val="([^"]+)"/) || [])[1] || "";
      if (style === "Heading3" && /^1\.\d/.test(t)) {
        lastSec1Idx = i;
      }
    }
    // Tìm đoạn cuối cùng của mục 1.x đó (tất cả đoạn thuộc nó)
    let insertAfterSec = endOfCh1Idx;
    insertAfterIdx = insertAfterSec;
    console.log(`✅ Sẽ chèn nội dung sau đoạn ${insertAfterIdx} (cuối mục 1.x cuối cùng)`);
  } else {
    // Fallback: chèn vào gần cuối tài liệu
    insertAfterIdx = paragraphs.length - 3;
    console.log(`⚠️  Không xác định được vị trí chính xác, chèn tại đoạn ${insertAfterIdx}`);
  }

  // Tạo khối nội dung lý thuyết
  const theoryBlock = buildTheorySection();

  // Chèn vào mảng đoạn văn
  paragraphs.splice(insertAfterIdx + 1, 0, theoryBlock);
  console.log(`Đã chèn nội dung lý thuyết (${theoryBlock.length} ký tự XML)`);

  // Ghép lại XML
  let idx = 0;
  xml = xml.replace(paragraphRegex, () => paragraphs[idx++] ?? "");

  // Ghi file output
  zip.file("word/document.xml", xml);
  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(DOC_OUT, out);
  console.log("\n✅ Hoàn thành! File đã được lưu tại:");
  console.log("  ", DOC_OUT);
}

main().catch((e) => {
  console.error("❌ Lỗi:", e.message || e);
  process.exit(1);
});
