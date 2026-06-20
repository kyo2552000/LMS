import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_IN = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.docx");
const DOC_OUT = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.chapter1-theory.docx");

function escXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function p(text, bold = false) {
    const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
    return `<w:p><w:r>${rPr}<w:t xml:space=\"preserve\">${escXml(text)}</w:t></w:r></w:p>`;
}

function decodeXml(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

function paragraphText(paragraphXml) {
    return [...paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => decodeXml(m[1])).join("").trim();
}

function buildTheoryBlock(mainIndex) {
    const h = `${mainIndex}. CƠ SỞ LÝ THUYẾT THEO CODEBASE DỰ ÁN`;
    const lines = [
        `${mainIndex}.1. Tổng quan kiến trúc hệ thống`,
        "EduLearn được triển khai theo mô hình full-stack trên Next.js App Router, trong đó frontend và backend cùng nằm trong một codebase để đồng bộ phát triển và triển khai.",
        `${mainIndex}.2. Khái niệm và mô hình thành phần`,
        "Frontend gồm các trang người dùng và quản trị trong app/, sử dụng React + TypeScript + TailwindCSS để xây dựng giao diện responsive.",
        "Backend là các API Routes trong app/api/, xử lý nghiệp vụ, xác thực, phân quyền và giao tiếp cơ sở dữ liệu.",
        `${mainIndex}.3. Công nghệ nền tảng và thư viện chính`,
        "Nền tảng chính: Next.js 16, React 18, TypeScript, TailwindCSS, MySQL.",
        "Thư viện lõi: mysql2 (kết nối CSDL), jsonwebtoken + bcryptjs (xác thực và bảo mật mật khẩu), zod (validation), @google/generative-ai (chatbot).",
        `${mainIndex}.4. Cơ sở dữ liệu và quan hệ nghiệp vụ`,
        "CSDL sử dụng MySQL với các bảng trọng tâm: users, courses, lessons, orders, enrollments, reviews, favorites, lesson_progress, lesson_comments, coupons.",
        "Luồng thanh toán và học tập: tạo orders -> xác nhận PAID -> tạo enrollments -> học viên truy cập nội dung khóa học.",
        `${mainIndex}.5. Hệ thống thanh toán trực tuyến`,
        "Hệ thống hiện hỗ trợ thanh toán chuyển khoản QR và xác nhận bởi admin; đây là phương án phù hợp giai đoạn MVP, đồng thời là nền tảng để mở rộng tích hợp cổng thanh toán tự động.",
        `${mainIndex}.6. Trí tuệ nhân tạo trong hệ thống`,
        "Chatbot EduBot tích hợp Google Gemini để hỗ trợ hỏi đáp học tập theo ngữ cảnh, giúp tăng tính tương tác và hỗ trợ tức thời cho học viên.",
        `${mainIndex}.7. Bảo mật ứng dụng web`,
        "Hệ thống áp dụng JWT cookie, mã hóa mật khẩu bằng bcryptjs, truy vấn có tham số để giảm nguy cơ SQL Injection, và phân quyền theo vai trò trong khu vực admin.",
    ];

    return p(h, true) + lines.map((x) => p(x)).join("");
}

async function main() {
    if (!fs.existsSync(DOC_IN)) {
        throw new Error(`Khong tim thay file: ${DOC_IN}`);
    }

    const zip = await JSZip.loadAsync(fs.readFileSync(DOC_IN));
    const doc = zip.file("word/document.xml");
    if (!doc) throw new Error("Khong tim thay word/document.xml");
    let xml = await doc.async("string");

    const paragraphRegex = /<w:p[\s\S]*?<\/w:p>/g;
    const paragraphs = [...xml.matchAll(paragraphRegex)].map((m) => m[0]);

    let ch1Idx = -1;
    let ch2Idx = -1;
    for (let i = 0; i < paragraphs.length; i++) {
        const t = paragraphText(paragraphs[i]);
        if (ch1Idx === -1 && t === "CHƯƠNG 1: CƠ SỞ LÝ THUYẾT") ch1Idx = i;
        if (ch2Idx === -1 && t === "CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG") ch2Idx = i;
    }
    if (ch1Idx === -1 || ch2Idx === -1 || ch2Idx <= ch1Idx) {
        throw new Error("Khong xac dinh duoc vi tri CHUONG 1/CHUONG 2 trong noi dung.");
    }

    // Tim so muc 1.x lon nhat trong khoang CHUONG 1 de dat muc tiep theo.
    let maxMain = 4;
    for (let i = ch1Idx + 1; i < ch2Idx; i++) {
        const t = paragraphText(paragraphs[i]);
        const m = t.match(/^1\.(\d+)\./);
        if (m) maxMain = Math.max(maxMain, Number(m[1]));
    }
    const newMainIndex = maxMain + 1;
    const block = buildTheoryBlock(newMainIndex);

    paragraphs.splice(ch2Idx, 0, block);

    let idx = 0;
    xml = xml.replace(paragraphRegex, () => paragraphs[idx++] ?? "");

    zip.file("word/document.xml", xml);
    const out = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });
    fs.writeFileSync(DOC_OUT, out);
    console.log("Da tao file moi:", DOC_OUT);
    console.log("Da chen muc ly thuyet vao CHUONG 1.");
}

main().catch((e) => {
    console.error("Loi:", e.message || e);
    process.exit(1);
});
