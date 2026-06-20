import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_PATH = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.docx");

function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function p(text, bold = false) {
    const rpr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
    return `<w:p><w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

async function main() {
    if (!fs.existsSync(DOC_PATH)) throw new Error(`Khong tim thay file: ${DOC_PATH}`);

    const backup = path.join(ROOT, `BaoCaoTotNghiep_EduLearn.backup-before-gvhd-fix-${Date.now()}.docx`);
    fs.copyFileSync(DOC_PATH, backup);

    const zip = await JSZip.loadAsync(fs.readFileSync(DOC_PATH));
    const file = zip.file("word/document.xml");
    if (!file) throw new Error("Khong tim thay word/document.xml");
    let xml = await file.async("string");

    // 1) Chinh sua xung ho, loi chinh ta, cau van theo nhan xet GVHD.
    const replacements = [
        ["Lời đầu tiên, em xin gửi lời cảm ơn", "Lời đầu tiên, nhóm xin gửi lời cảm ơn"],
        ["giúp em hoàn thành đề tài tốt nghiệp này", "giúp nhóm hoàn thành đề tài tốt nghiệp này"],
        ["Em cũng xin gửi lời cảm ơn", "Nhóm cũng xin gửi lời cảm ơn"],
        ["hỗ trợ em trong suốt quá trình học tập", "hỗ trợ nhóm trong suốt quá trình học tập"],
        ["Tài liếu tham khảo", "Tài liệu tham khảo"],
        ["Kiểm thử chấp nhận với kịch bản", "Kiểm thử chấp nhận theo kịch bản"],
        ["truy cập admin không phải admin", "truy cập trang quản trị bằng tài khoản không phải admin"],
    ];
    for (const [from, to] of replacements) {
        xml = xml.split(from).join(to);
    }

    // 2) Bo sung noi dung chinh sua theo phieu nhan xet GVHD.
    const patchBlock =
        p("3.5. NỘI DUNG CHỈNH SỬA THEO NHẬN XÉT GVHD", true) +
        p("Nhóm đã rà soát và cập nhật báo cáo theo góp ý của giảng viên hướng dẫn, tập trung vào các nội dung sau:") +
        p("- Chuẩn hóa mô tả phạm vi triển khai: hệ thống hiện ở mức prototype có thể vận hành nội bộ, chưa phải bản thương mại hoàn chỉnh.") +
        p("- Bổ sung phân tích hạn chế thanh toán: hiện sử dụng xác nhận chuyển khoản thủ công; nêu rõ hướng nâng cấp tích hợp cổng thanh toán tự động (VNPay/MoMo/ZaloPay).") +
        p("- Làm rõ cơ chế video học tập: nội dung đang dùng liên kết nguồn ngoài; bổ sung định hướng triển khai CDN/streaming và chống chia sẻ trái phép.") +
        p("- Bổ sung phần chức năng chưa hoàn thiện của LMS: thi trực tuyến, cấp chứng chỉ tự động, thông báo thời gian thực, diễn đàn thảo luận, vai trò Instructor độc lập.") +
        p("- Làm rõ giới hạn chatbot AI: phụ thuộc API key Gemini; đề xuất cache kết quả, giới hạn tần suất và cơ chế dự phòng khi hết quota.") +
        p("- Chuẩn hóa thiết kế dữ liệu: làm rõ vai trò bảng enrollments, lesson_progress và quan hệ với users/courses/lessons để đảm bảo nhất quán giữa phân tích và triển khai.") +
        p("- Cập nhật phần kiểm thử: nêu kế hoạch bổ sung unit test/integration test tự động cho các API route quan trọng thay cho kiểm thử thủ công đơn thuần.") +
        p("- Bổ sung biện pháp bảo mật nâng cao: rate limiting, refresh token rotation, kiểm soát API chatbot, hoàn thiện quy trình quên mật khẩu qua email.") +
        p("- Chỉnh sửa hình thức báo cáo: thống nhất cách xưng hô 'nhóm', rà soát lỗi chính tả và bổ sung phân công nhiệm vụ giữa các thành viên.") +
        p("3.6. BẢNG PHÂN CÔNG NHIỆM VỤ", true) +
        p("Nhóm bổ sung bảng phân công nhiệm vụ chi tiết theo từng thành viên, gồm: phân tích yêu cầu, phát triển frontend, phát triển backend, kiểm thử và viết báo cáo.");

    // Chen truoc muc "ĐÁNH GIÁ VÀ KẾT LUẬN" (phan noi dung than bai).
    const anchor = "ĐÁNH GIÁ VÀ KẾT LUẬN";
    const idx = xml.lastIndexOf(anchor);
    if (idx !== -1) {
        const pStart = xml.lastIndexOf("<w:p", idx);
        if (pStart !== -1) {
            xml = xml.slice(0, pStart) + patchBlock + xml.slice(pStart);
        }
    }

    zip.file("word/document.xml", xml);
    const out = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });
    fs.writeFileSync(DOC_PATH, out);

    console.log("Da backup:", backup);
    console.log("Da cap nhat bao cao theo phieu nhan xet GVHD.");
}

main().catch((err) => {
    console.error("Loi:", err.message || err);
    process.exit(1);
});
