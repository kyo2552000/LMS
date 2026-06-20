/**
 * Đọc file mẫu "Bản sao của NguyenDucKien_DoAn.pptx", thay nội dung bằng đồ án EduLearn,
 * chèn sơ đồ PNG từ generated-diagrams/, ghi ra EduLearn_ThuyetTrinh_DoAn.pptx
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const diagramsDir = path.join(projectRoot, "generated-diagrams");

function findTemplatePptx(dir) {
  const files = fs.readdirSync(dir);
  return files.find(
    (f) =>
      f.endsWith(".pptx") &&
      (f.includes("NguyenDucKien") || f.includes("Bản sao"))
  );
}

function applyTextReplacements(str) {
  let s = str;
  /** @type {Array<[string, string]>} */
  const pairs = [
    [
      "Xây dựng Website bán giày cho công ty SMARTMEN sử dụng PHP Lavarel",
      "Xây dựng nền tảng học trực tuyến EduLearn sử dụng Next.js, React và MySQL",
    ],
    [
      "Website Bán Giày Cho Công Ty Smartmen Sử Dụng Php Lavarel",
      "Nền tảng học trực tuyến EduLearn (Next.js + MySQL)",
    ],
    [
      "Phân tích thiết kế hệ thống ứng website bán giày SmartMen",
      "Phân tích thiết kế hệ thống website học trực tuyến EduLearn",
    ],
    [
      "Tổng quan về website bán giày SmartMen",
      "Tổng quan về nền tảng học trực tuyến EduLearn",
    ],
    ["Người thực hiện: Nguyễn Đức Kiên", "Sinh viên thực hiện: (điền họ tên)"],
    ["27/5/2024 9:46 PM", "05/2026"],
    ["Khách hàng", "Học viên"],
    [
      "Các tác nhân chính của hệ thống website \u201CWebsite Bán Giày Cho Công Ty Smartmen Sử Dụng Php Lavarel\u201D gồm có: Quản trị viên, Khách hàng.",
      "Các tác nhân chính của hệ thống EduLearn gồm: Quản trị viên, Giảng viên (Instructor) và Học viên.",
    ],
    [
      "Các tác nhân chính của hệ thống website \u201CWebsite Bán Giày Cho Công Ty Smartmen Sử Dụng Php Lavarel\u201D gồm có: Quản trị viên, Khách hàng",
      "Các tác nhân chính của hệ thống EduLearn gồm: Quản trị viên, Giảng viên và Học viên",
    ],
    [
      "Các tác nhân của hệ thống, use case tổng quát và sơ đồ thực thể liên kết ",
      "Các tác nhân, use case, sơ đồ ERD và kiến trúc hệ thống EduLearn ",
    ],
    [
      "Một số hình ảnh về website và hướng phát triển",
      "Giao diện chức năng chính và hướng phát triển",
    ],
    [
      "Lý do chọn đề tài, Mục đích, Công nghệ đã sử dụng",
      "Lý do chọn đề tài, mục tiêu, công nghệ (Next.js, MySQL, Gemini AI)",
    ],
    [
      "Vận  dụng  những  kiến  thức đã học  về PHP",
      "Vận dụng kiến thức lập trình web hiện đại (React, TypeScript, API REST)",
    ],
    [
      "xây dựng một Website online để phục vụ khách hàng có nhu cầu mua giày một cách tiện lợi và nhanh chóng",
      "xây dựng website học trực tuyến: khóa học, thanh toán, học video/quiz/tài liệu, chatbot AI",
    ],
    [
      "xây dựng một Website online  | nhằm |  phục vụ khách hàng có nhu cầu mua giày một cách tiện lợi và nhanh chóng",
      "xây dựng EduLearn nhằm hỗ trợ học viên học mọi lúc, quản trị nội dung và thanh toán minh bạch",
    ],
    [
      "T | ăng trải nghiệm cho người mua từ đó tăng doanh thu cho cửa hang |  đồng thời giúp quản lý cửa hàng một cách dễ dàng",
      "Tăng trải nghiệm học tập; hỗ trợ giảng viên quản lý khóa học; admin vận hành hệ thống",
    ],
    [
      "T | ăng trải nghiệm cho người mua từ đó tăng doanh thu cho cửa hang |  đồng thời giúp người quản trị quản lý cửa hàng một cách dễ dàng",
      "Tăng hiệu quả học tập trực tuyến; quản trị người dùng, đơn hàng, mã giảm giá và nội dung khóa học",
    ],
    [
      "Mong muốn đáp ứng được nhu cầu mua sắm trực tuyến trong lĩnh vực giày dép nam",
      "Đáp ứng nhu cầu học trực tuyến, tra cứu khóa học và được tư vấn nhanh qua chatbot AI",
    ],
    [
      "Giúp tối ưu hoá chi phí, nâng cao hiệu quả kinh doanh. Dễ dàng quản lý cửa hàng",
      "Tối ưu quy trình ghi danh, thanh toán VietQR và quản lý tiến độ học tập",
    ],
    [
      "Quảng bá được hình ảnh, nâng tầm thương hiệu và uy tín cho cửa hàng",
      "Tích hợp đánh giá khóa học, bình luận bài học và chứng chỉ khi hoàn thành",
    ],
    [
      " Giúp tối ưu hoá thời gian cho khách hàng trong cuộc sống",
      " Giúp học viên chủ động thời gian, học lại video và tiếp tục từ vị trí đã xem",
    ],
    [
      "1.4 Yêu cầu chức năng đối với khách hang",
      "1.4 Yêu cầu chức năng đối với học viên",
    ],
    [
      "1.3 Yêu cầu chức năng đối với quản trị viên",
      "1.3 Yêu cầu chức năng đối với quản trị viên & giảng viên",
    ],
    [
      "Giao diện đăng kí thành viên",
      "Luồng đăng ký / đăng nhập (JWT, cookie)",
    ],
    ["Giao diện trang chủ", "Trang chủ — khóa học nổi bật"],
    [
      "Giao diện chi tiết sản phẩm",
      "Chi tiết khóa học & danh sách bài học",
    ],
    ["Giao diện giỏ hàng", "Giỏ hàng & thanh toán (VietQR)"],
    ["Giao diện đơn hàng của bạn", "Lịch sử đơn hàng học viên"],
    [
      "Giao diện chi tiết đơn hàng của bạn",
      "Chi tiết đơn hàng & áp dụng coupon",
    ],
    [
      "Giao diện chi tiết đơn hàng phía admin",
      "Admin duyệt đơn & quản lý hệ thống",
    ],
    ["Giao diện thống kê", "Dashboard admin (Recharts)"],
    [
      "Tiếp tục phát triển và mở rộng tính năng để cải thiện trải nghiệm người dùng",
      "Mở rộng tính năng: streaming video, thông báo realtime, forum học viên",
    ],
    [
      "Sửa các lỗi và cải thiện tính bảo mật của website",
      "Củng cố bảo mật: RBAC theo permission, audit log, hardening API",
    ],
    [
      "Tích hợp  | đăng nhập hệ thống  | bằng  | Facebook, Gmail để tăng tính tiện lợi cho người dùng",
      "Hoàn thiện đăng nhập Google OAuth (NextAuth) và tích hợp cổng thanh toán tự động",
    ],
    [
      "Tối ưu hóa mã nguồn và cơ sở dữ liệu để tăng hiệu suất và độ tin cậy của hệ thống",
      "Tối ưu truy vấn MySQL, cache ISR trang chủ, giám sát lỗi (Sentry)",
    ],
    [
      "Thêm nhiều phương thức thanh toán khác nhau",
      "Thêm VNPay/MoMo và xác nhận thanh toán tự động",
    ],
    ["Kết quả giao diện, các chức năng hoàn thiện", "Kết quả: giao diện và các module chính của EduLearn"],
    ["2.3 Sơ đồ thực thể liên kết", "2.3 Sơ đồ ERD (cơ sở dữ liệu EduLearn)"],
    ["giày dép nam", "học trực tuyến"],
    ["cửa hàng", "nền tảng"],
    ["mua giày", "học khóa học"],
    ["người mua", "học viên"],
    ["cửa hang", "hệ thống"],
  ];

  for (const [a, b] of pairs) {
    if (s.includes(a)) s = s.split(a).join(b);
  }

  s = s.replace(/Khách hàng/g, "Học viên");

  return s;
}

function replaceMedia(zip, zipPath, filePath) {
  const buf = fs.readFileSync(filePath);
  zip.file(zipPath, buf, { binary: true });
}

async function main() {
  const templateName = findTemplatePptx(projectRoot);
  if (!templateName) {
    console.error("Không tìm thấy file .pptx mẫu (NguyenDucKien / Bản sao).");
    process.exit(1);
  }
  const templatePath = path.join(projectRoot, templateName);
  const outName = "EduLearn_ThuyetTrinh_DoAn.pptx";
  const outPath = path.join(projectRoot, outName);

  const buf = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(buf);

  const png = (name) => path.join(diagramsDir, name);

  const diagramFiles = {
    "ppt/media/edu_slide12.png": png("01-1-1-use-case-tong-quat.png"),
    "ppt/media/edu_slide13.png": png("02-1-2-use-case-chi-tiet-quan-ly-tai-khoan.png"),
    "ppt/media/edu_slide14.png": png("03-1-3-use-case-chi-tiet-quan-ly-khoa-hoc.png"),
    "ppt/media/edu_slide15.png": png("04-1-4-use-case-chi-tiet-thanh-toan-on-hang.png"),
    "ppt/media/edu_slide16.png": png("05-1-5-use-case-chi-tiet-chatbot-ai.png"),
    "ppt/media/edu_slide17.png": png("06-1-6-use-case-chi-tiet-admin.png"),
    "ppt/media/image26.png": png("13-4-1-erd-tong-quat.png"),
    "ppt/media/image27.png": png("07-2-1-hoat-ong-ang-nhap.png"),
    "ppt/media/image28.png": png("14-5-1-kien-truc-tong-the-he-thong.png"),
    "ppt/media/image29.png": png("03-1-3-use-case-chi-tiet-quan-ly-khoa-hoc.png"),
    "ppt/media/image30.png": png("09-2-3-hoat-ong-mua-khoa-hoc.png"),
    "ppt/media/image31.png": png("16-6-2-xu-ly-mua-khoa-hoc.png"),
    "ppt/media/image32.png": png("04-1-4-use-case-chi-tiet-thanh-toan-on-hang.png"),
    "ppt/media/image33.png": png("11-2-5-hoat-ong-admin-quan-ly-du-lieu.png"),
    "ppt/media/image34.png": png("10-2-4-hoat-ong-chatbot-ai.png"),
  };

  for (const [zPath, diskPath] of Object.entries(diagramFiles)) {
    if (!fs.existsSync(diskPath)) {
      console.warn("Thiếu file sơ đồ:", diskPath);
      continue;
    }
    replaceMedia(zip, zPath, diskPath);
  }

  for (let i = 12; i <= 17; i++) {
    const relPath = `ppt/slides/_rels/slide${i}.xml.rels`;
    let rel = await zip.file(relPath).async("string");
    rel = rel.replace(
      'Target="../media/image25.emf"',
      `Target="../media/edu_slide${i}.png"`
    );
    zip.file(relPath, rel);
  }

  const textLike = (name) =>
    name.endsWith(".xml") ||
    name.endsWith(".rels") ||
    name === "[Content_Types].xml";

  for (const name of Object.keys(zip.files)) {
    const entry = zip.files[name];
    if (entry.dir || !textLike(name)) continue;
    if (name.startsWith("ppt/embed/")) continue;
    const text = await entry.async("string");
    const next = applyTextReplacements(text);
    if (next !== text) zip.file(name, next);
  }

  // docProps/core.xml — tiêu đề metadata
  const corePath = "docProps/core.xml";
  if (zip.file(corePath)) {
    let core = await zip.file(corePath).async("string");
    core = core.replace(
      "<dc:title>PowerPoint Presentation</dc:title>",
      "<dc:title>Đồ án: Nền tảng học trực tuyến EduLearn</dc:title>"
    );
    core = core.replace(
      "<dc:creator>Koiboi Kiên</dc:creator>",
      "<dc:creator>EduLearn — Đồ án tốt nghiệp</dc:creator>"
    );
    zip.file(corePath, core);
  }

  const outBuf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(outPath, outBuf);
  console.log("Đã tạo:", outPath);
  console.log("Nguồn mẫu:", templatePath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
