/**
 * danh-muc-bang-bieu-full.mjs
 * Tìm TẤT CẢ bảng <w:tbl> trong docx, đặt/cập nhật caption chuẩn "Bảng X.Y: ..."
 * rồi tạo DANH MỤC BẢNG BIỂU hoàn chỉnh tự cập nhật số trang trong Word.
 */
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const allDocx = fs.readdirSync(ROOT).filter(f => f.endsWith(".docx"));
const inputFile = allDocx.find(f =>
  f.includes("o 2") && !f.includes("final") && !f.includes("Final") && !f.includes("có")
) || allDocx.find(f => f.includes("o 2") && !f.includes("final"));
if (!inputFile) { console.error("❌ Không tìm thấy file!"); process.exit(1); }

const INPUT  = path.join(ROOT, inputFile);
const OUTPUT = path.join(ROOT, "Báo cáo 2 (full-danh-muc).docx");
console.log("📖 Input:", inputFile);

const CAPTION_STYLE_ID = "Caption";

// ─── Danh sách tên bảng chuẩn dựa trên kết quả scan ─────────────────────────
// Mỗi entry: { tblIndex: số thứ tự (1-based), caption: "Bảng X.Y: tên" }
// tblIndex tính theo thứ tự xuất hiện của <w:tbl> trong tài liệu
const TABLE_CAPTIONS = [
  // Bảng 1-8: Phần đầu (mục lục, use case overview)
  { tblIndex: 1,  caption: "Bảng 2.1: Danh sách chức năng người dùng chưa đăng nhập" },
  { tblIndex: 2,  caption: "Bảng 2.2: Danh sách chức năng người dùng đã đăng nhập" },
  { tblIndex: 3,  caption: "Bảng 2.3: Danh sách chức năng Quản trị viên (Admin)" },
  { tblIndex: 4,  caption: "Bảng 2.4: Danh sách chức năng Giảng viên (Instructor)" },
  { tblIndex: 5,  caption: "Bảng 2.5: Danh sách chức năng Học viên (Student)" },
  { tblIndex: 6,  caption: "Bảng 2.6: Danh sách Actor và vai trò hệ thống" },
  { tblIndex: 7,  caption: "Bảng 2.7: Yêu cầu chức năng hệ thống" },
  { tblIndex: 8,  caption: "Bảng 2.8: Yêu cầu phi chức năng (Bảo mật, Hiệu năng, Giao diện)" },
  // Use Case chi tiết
  { tblIndex: 9,  caption: "Bảng 2.9: Use Case chi tiết – Đăng nhập" },
  { tblIndex: 10, caption: "Bảng 2.10: Use Case chi tiết – Đăng ký tài khoản" },
  { tblIndex: 11, caption: "Bảng 2.11: Use Case chi tiết – Đổi mật khẩu" },
  { tblIndex: 12, caption: "Bảng 2.12: Use Case chi tiết – Duyệt và tìm kiếm khóa học" },
  { tblIndex: 13, caption: "Bảng 2.13: Use Case chi tiết – Mua khóa học" },
  { tblIndex: 14, caption: "Bảng 2.14: Use Case chi tiết – Chat với Chatbot AI" },
  { tblIndex: 15, caption: "Bảng 2.15: Use Case chi tiết – Dashboard Admin" },
  { tblIndex: 16, caption: "Bảng 2.16: Use Case chi tiết – Quản lý CRUD" },
  // Mô tả CSDL
  { tblIndex: 17, caption: "Bảng 4.1: Mô tả bảng USERS – Người dùng" },
  { tblIndex: 18, caption: "Bảng 4.2: Mô tả bảng COURSES – Khóa học" },
  { tblIndex: 19, caption: "Bảng 4.3: Mô tả bảng LESSONS – Bài học" },
  { tblIndex: 20, caption: "Bảng 4.4: Mô tả bảng ORDERS – Đơn hàng" },
  { tblIndex: 21, caption: "Bảng 4.5: Mô tả bảng CHAT_MESSAGES – Tin nhắn chat" },
  { tblIndex: 22, caption: "Bảng 4.6: Ràng buộc dữ liệu và khóa ngoại" },
  { tblIndex: 23, caption: "Bảng 4.7: Mối quan hệ giữa các bảng trong cơ sở dữ liệu" },
  // Cài đặt
  { tblIndex: 24, caption: "Bảng 5.1: Danh sách công nghệ và phiên bản sử dụng" },
  { tblIndex: 25, caption: "Bảng 5.2: Công cụ phát triển" },
  { tblIndex: 26, caption: "Bảng 5.3: Thông tin dịch vụ Google Gemini API" },
  { tblIndex: 27, caption: "Bảng 5.4: Thông tin dịch vụ Unsplash" },
  { tblIndex: 28, caption: "Bảng 5.5: Thông tin dịch vụ Google Fonts" },
  // Kiểm thử
  { tblIndex: 29, caption: "Bảng 6.1: Phạm vi kiểm thử theo module" },
  { tblIndex: 30, caption: "Bảng 6.2: Môi trường kiểm thử" },
  { tblIndex: 31, caption: "Bảng 6.3: Công cụ kiểm thử" },
  { tblIndex: 32, caption: "Bảng 6.4: Test Case – Đăng nhập / Xác thực" },
  { tblIndex: 33, caption: "Bảng 6.5: Test Case – Đăng ký tài khoản" },
  { tblIndex: 34, caption: "Bảng 6.6: Test Case – Tìm kiếm và lọc khóa học" },
  { tblIndex: 35, caption: "Bảng 6.7: Test Case – Mua khóa học" },
  { tblIndex: 36, caption: "Bảng 6.8: Test Case – ChatBot AI" },
  { tblIndex: 37, caption: "Bảng 6.9: Test Case – Admin Dashboard" },
  { tblIndex: 38, caption: "Bảng 6.10: Test Case – Admin CRUD Users" },
  { tblIndex: 39, caption: "Bảng 6.11: Test Case – Admin Quản lý đơn hàng" },
  { tblIndex: 40, caption: "Bảng 6.12: Test Case – Admin CRUD Courses/Lessons/Categories" },
  { tblIndex: 41, caption: "Bảng 6.13: Test Case – Đổi mật khẩu" },
  { tblIndex: 42, caption: "Bảng 6.14: Test Case – Bảo mật hệ thống" },
  // Test Report
  { tblIndex: 43, caption: "Bảng 6.15: Tổng kết kết quả kiểm thử" },
  { tblIndex: 44, caption: "Bảng 6.16: Kết quả kiểm thử theo module" },
  { tblIndex: 45, caption: "Bảng 6.17: Danh sách lỗi phát hiện và cách khắc phục" },
  // Đánh giá
  { tblIndex: 46, caption: "Bảng 7.1: Mức độ hoàn thành mục tiêu ban đầu" },
  // Phụ lục
  { tblIndex: 47, caption: "Bảng A.1: Tài khoản đăng nhập mẫu" },
];

// ─── XML Helpers ──────────────────────────────────────────────────────────────
function escXml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function ensureCaptionStyle(stylesXml) {
  if (stylesXml.includes(`w:styleId="${CAPTION_STYLE_ID}"`)) return stylesXml;
  const def = `
  <w:style w:type="paragraph" w:styleId="${CAPTION_STYLE_ID}">
    <w:name w:val="Caption"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="60" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:i/><w:iCs/>
      <w:sz w:val="24"/><w:szCs w:val="24"/>
    </w:rPr>
  </w:style>`;
  return stylesXml.replace("</w:styles>", def + "\n</w:styles>");
}

// Tạo đoạn caption chuẩn với style Caption
function makeCaptionPara(text) {
  return `<w:p>
  <w:pPr>
    <w:pStyle w:val="${CAPTION_STYLE_ID}"/>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:b/><w:bCs/>
      <w:sz w:val="24"/><w:szCs w:val="24"/>
    </w:rPr>
    <w:t xml:space="preserve">${escXml(text)}</w:t>
  </w:r>
</w:p>`;
}

// Tạo DANH MỤC field
function buildDanhMucSection() {
  const heading = `<w:p>
  <w:pPr>
    <w:pStyle w:val="Heading1"/>
    <w:jc w:val="center"/>
    <w:pageBreakBefore/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:b/><w:bCs/><w:caps/>
      <w:sz w:val="28"/><w:szCs w:val="28"/>
    </w:rPr>
    <w:t>DANH MỤC BẢNG BIỂU</w:t>
  </w:r>
</w:p>`;

  const tof = `<w:p>
  <w:pPr><w:pStyle w:val="Normal"/><w:jc w:val="left"/></w:pPr>
  <w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>
  <w:r><w:rPr><w:noProof/></w:rPr>
    <w:instrText xml:space="preserve"> TOC \\h \\z \\t "${CAPTION_STYLE_ID},1" </w:instrText>
  </w:r>
  <w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
  <w:r>
    <w:rPr><w:noProof/><w:color w:val="808080"/></w:rPr>
    <w:t>[ Mở Word → Ctrl+A → F9 → "Update entire table" để cập nhật số trang ]</w:t>
  </w:r>
  <w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
</w:p>`;

  return heading + "\n" + tof + "\n" + `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(INPUT));

  // 1) styles.xml
  let stylesXml = await zip.file("word/styles.xml").async("string");
  stylesXml = ensureCaptionStyle(stylesXml);
  zip.file("word/styles.xml", stylesXml);
  console.log("✔ Style Caption đã đảm bảo");

  // 2) document.xml: tìm tất cả <w:tbl> theo offset
  let docXml = await zip.file("word/document.xml").async("string");

  // Thu thập tất cả block (para + tbl)
  const blockRe = /(<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>)/g;
  let blocks = [];
  let m;
  while ((m = blockRe.exec(docXml)) !== null) {
    blocks.push({
      type: m[0].startsWith("<w:tbl>") ? "tbl" : "para",
      raw: m[0],
      offset: m.index,
    });
  }

  // Lấy vị trí offset của từng <w:tbl> theo thứ tự
  const tblBlocks = blocks.filter(b => b.type === "tbl");
  console.log(`📊 Tổng số bảng tìm thấy: ${tblBlocks.length}`);

  // 3) Chèn caption trước mỗi bảng (xử lý từ cuối → đầu để offset không lệch)
  const captionMap = {};
  TABLE_CAPTIONS.forEach(({ tblIndex, caption }) => { captionMap[tblIndex] = caption; });

  // Làm việc trực tiếp trên docXml với replace từ cuối
  for (let i = tblBlocks.length - 1; i >= 0; i--) {
    const tblNum = i + 1; // 1-based
    const caption = captionMap[tblNum];
    if (!caption) continue;

    const { raw, offset } = tblBlocks[i];
    const captionPara = makeCaptionPara(caption);

    // Chèn caption TRƯỚC bảng
    docXml = docXml.substring(0, offset) + captionPara + "\n" + docXml.substring(offset);
    console.log(`  ✓ Bảng #${tblNum}: "${caption}"`);

    // Cập nhật offset của các bảng trước (không cần vì đang đi từ cuối)
    // Cập nhật tblBlocks offset cho các bảng tiếp theo không cần thiết vì đi từ cuối
  }

  // 4) Kiểm tra đã có DANH MỤC BẢNG BIỂU chưa
  const re2 = /(<w:p[ >][\s\S]*?<\/w:p>)/g;
  let hasDanhMuc = false;
  let pm2;
  while ((pm2 = re2.exec(docXml)) !== null) {
    const t = [...pm2[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(x=>x[1]).join("").trim();
    if (t.includes("DANH MỤC BẢNG BIỂU")) { hasDanhMuc = true; break; }
  }

  if (!hasDanhMuc) {
    // Tìm CHƯƠNG 1
    const re3 = /(<w:p[ >][\s\S]*?<\/w:p>)/g;
    let pm3, ch1Offset = -1;
    while ((pm3 = re3.exec(docXml)) !== null) {
      const t = [...pm3[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(x=>x[1]).join("").trim();
      const style = (pm3[0].match(/w:pStyle w:val="([^"]+)"/) || [])[1] || "";
      if (style === "Heading2" && t.includes("CHƯƠNG 1")) {
        ch1Offset = pm3.index;
        break;
      }
    }
    const section = buildDanhMucSection();
    if (ch1Offset >= 0) {
      docXml = docXml.substring(0, ch1Offset) + section + "\n" + docXml.substring(ch1Offset);
      console.log("✔ Đã chèn DANH MỤC BẢNG BIỂU trước CHƯƠNG 1");
    } else {
      const bodyStart = docXml.indexOf("<w:body>") + "<w:body>".length;
      docXml = docXml.substring(0, bodyStart) + "\n" + section + "\n" + docXml.substring(bodyStart);
      console.log("✔ Đã chèn DANH MỤC BẢNG BIỂU vào đầu tài liệu");
    }
  } else {
    console.log("ℹ️  Đã có DANH MỤC BẢNG BIỂU, không chèn thêm");
  }

  // 5) Lưu
  zip.file("word/document.xml", docXml);
  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  fs.writeFileSync(OUTPUT, buf);

  console.log("\n✅ XONG! File lưu tại:", OUTPUT);
  console.log("\n📌 SAU KHI MỞ TRONG WORD:");
  console.log("   Ctrl+A → F9 → 'Update entire table'");
  console.log("   Danh mục sẽ tự điền đúng số trang!\n");
}

main().catch(e => { console.error("❌ Lỗi:", e.message || e); process.exit(1); });
