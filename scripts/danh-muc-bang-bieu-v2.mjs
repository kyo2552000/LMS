/**
 * danh-muc-bang-bieu-v2.mjs
 * - Gán style Caption cho TẤT CẢ caption: Hình X.X, Bảng X (cả dạng không số)
 * - Tạo DANH MỤC BẢNG BIỂU VÀ SƠ ĐỒ bằng TOF field tự cập nhật
 * - Chèn vào đầu tài liệu (trước CHƯƠNG 1) nếu chưa tồn tại
 */
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Tự động tìm file báo cáo 2 (ưu tiên bản gốc, không lấy final)
const allDocx = fs.readdirSync(ROOT).filter(f => f.endsWith(".docx"));
console.log("Các file .docx:", allDocx);
const inputFile = allDocx.find(f =>
  f.includes("o 2") && !f.includes("final") && !f.includes("Final") && !f.includes("có")
) || allDocx.find(f => f.includes("o 2") && !f.includes("final"));

if (!inputFile) { console.error("❌ Không tìm thấy file Báo cáo 2!"); process.exit(1); }
const INPUT  = path.join(ROOT, inputFile);
const OUTPUT = path.join(ROOT, "Báo cáo 2 (final-v2).docx");
console.log("📖 Input:", inputFile);

const CAPTION_STYLE_ID = "Caption";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractText(xml) {
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map(m => m[1]).join("").trim();
}

function isCaption(text) {
  // Hình X.X:, Hình X:
  if (/^H[iì]nh\s+\d/.test(text)) return true;
  // Sơ đồ X.X:, Biểu đồ X.X:
  if (/^(S[oơ]\s*đồ|Biểu\s*đồ)\s+\d/.test(text)) return true;
  // Bảng X.X:, Bảng X:, Bảng USERS (tên bảng DB)
  if (/^Bảng\s+/i.test(text)) return true;
  return false;
}

function ensureCaptionStyle(stylesXml) {
  if (stylesXml.includes(`w:styleId="${CAPTION_STYLE_ID}"`)) return stylesXml;
  const def = `
  <w:style w:type="paragraph" w:styleId="${CAPTION_STYLE_ID}">
    <w:name w:val="${CAPTION_STYLE_NAME}"/>
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

const CAPTION_STYLE_NAME = "Caption";

function applyCaption(paraXml) {
  const tag = `<w:pStyle w:val="${CAPTION_STYLE_ID}"/>`;
  if (paraXml.includes(tag)) return paraXml;
  if (/<w:pPr>/.test(paraXml)) {
    return paraXml.replace(/<w:pPr>/, `<w:pPr>${tag}`);
  }
  return paraXml.replace(/(<w:p[ >][^>]*>)/, `$1<w:pPr>${tag}</w:pPr>`);
}

function buildDanhMucSection() {
  // Heading "DANH MỤC BẢNG BIỂU VÀ SƠ ĐỒ"
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
    <w:t>DANH MỤC BẢNG BIỂU VÀ SƠ ĐỒ</w:t>
  </w:r>
</w:p>`;

  // TOF field: lấy tất cả đoạn style Caption
  const tof = `<w:p>
  <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
  <w:r><w:rPr><w:noProof/></w:rPr>
    <w:fldChar w:fldCharType="begin" w:dirty="true"/>
  </w:r>
  <w:r><w:rPr><w:noProof/></w:rPr>
    <w:instrText xml:space="preserve"> TOC \\h \\z \\t "${CAPTION_STYLE_ID},1" </w:instrText>
  </w:r>
  <w:r><w:rPr><w:noProof/></w:rPr>
    <w:fldChar w:fldCharType="separate"/>
  </w:r>
  <w:r>
    <w:rPr><w:noProof/><w:color w:val="808080"/></w:rPr>
    <w:t xml:space="preserve">[ Mở Word → Ctrl+A → F9 → "Update entire table" để cập nhật số trang ]</w:t>
  </w:r>
  <w:r><w:rPr><w:noProof/></w:rPr>
    <w:fldChar w:fldCharType="end"/>
  </w:r>
</w:p>`;

  const pageBreak = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
  return heading + "\n" + tof + "\n" + pageBreak;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(INPUT));

  // 1) styles.xml
  let stylesXml = await zip.file("word/styles.xml").async("string");
  stylesXml = ensureCaptionStyle(stylesXml);
  zip.file("word/styles.xml", stylesXml);
  console.log("✔ Style Caption đã đảm bảo");

  // 2) document.xml
  let docXml = await zip.file("word/document.xml").async("string");
  const paraRe = /<w:p[ >][\s\S]*?<\/w:p>/g;

  // Thu thập tất cả paragraph
  let allParas = [];
  let pm;
  const re1 = new RegExp(paraRe.source, "g");
  while ((pm = re1.exec(docXml)) !== null) {
    allParas.push({ raw: pm[0], offset: pm.index });
  }
  console.log(`📊 Tổng đoạn văn: ${allParas.length}`);

  // Gán Caption từ cuối → đầu để offset không lệch
  let captionCount = 0;
  const captionList = [];
  for (let i = allParas.length - 1; i >= 0; i--) {
    const { raw, offset } = allParas[i];
    const text = extractText(raw);
    // Bỏ qua đoạn trong mục lục (thường rất ngắn, có số trang dính cuối)
    // Kiểm tra: đoạn trong mục lục thường kết thúc bằng số trang "\d{1,3}$"
    const cleanText = text.replace(/\d{1,3}$/, "").trim();
    if (isCaption(text) && !text.match(/\d{1,3}$/) ) {
      // Đây là caption thực (không có số trang dính vào)
      const newPara = applyCaption(raw);
      if (newPara !== raw) {
        docXml = docXml.substring(0, offset) + newPara + docXml.substring(offset + raw.length);
        captionCount++;
        captionList.unshift(`  ✓ ${text.substring(0, 90)}`);
      }
    }
  }
  console.log(`✔ Đã gán Caption cho ${captionCount} mục:`);
  captionList.forEach(t => console.log(t));

  // 3) Kiểm tra đã có DANH MỤC BẢNG BIỂU chưa
  const re2 = new RegExp(paraRe.source, "g");
  let hasDanhMuc = false;
  let pm2;
  while ((pm2 = re2.exec(docXml)) !== null) {
    const t = extractText(pm2[0]);
    if (t.includes("DANH MỤC BẢNG BIỂU") || t.includes("DANH MỤC HÌNH")) {
      hasDanhMuc = true;
      console.log("ℹ️  Đã có phần DANH MỤC tại offset:", pm2.index);
      break;
    }
  }

  if (!hasDanhMuc) {
    // Tìm vị trí CHƯƠNG 1 để chèn trước
    const re3 = new RegExp(paraRe.source, "g");
    let ch1Offset = -1;
    let pm3;
    while ((pm3 = re3.exec(docXml)) !== null) {
      const t = extractText(pm3[0]);
      const style = (pm3[0].match(/w:pStyle w:val="([^"]+)"/) || [])[1] || "";
      if (style === "Heading2" && t.includes("CHƯƠNG 1")) {
        ch1Offset = pm3.index;
        console.log(`✔ Tìm thấy CHƯƠNG 1 tại offset: ${ch1Offset}`);
        break;
      }
    }

    const section = buildDanhMucSection();
    if (ch1Offset >= 0) {
      docXml = docXml.substring(0, ch1Offset) + section + "\n" + docXml.substring(ch1Offset);
      console.log("✔ Đã chèn DANH MỤC BẢNG BIỂU VÀ SƠ ĐỒ trước CHƯƠNG 1");
    } else {
      const bodyStart = docXml.indexOf("<w:body>") + "<w:body>".length;
      docXml = docXml.substring(0, bodyStart) + "\n" + section + "\n" + docXml.substring(bodyStart);
      console.log("✔ Đã chèn DANH MỤC BẢNG BIỂU vào đầu tài liệu");
    }
  }

  // 4) Lưu
  zip.file("word/document.xml", docXml);
  const buf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(OUTPUT, buf);

  console.log("\n✅ XONG! File lưu tại:");
  console.log("  ", OUTPUT);
  console.log("\n📌 SAU KHI MỞ TRONG WORD:");
  console.log("   Ctrl+A  →  F9  →  'Update entire table'");
  console.log("   Danh mục sẽ tự điền đúng tên và số trang!\n");
}

main().catch(e => {
  console.error("❌ Lỗi:", e.message || e);
  process.exit(1);
});
