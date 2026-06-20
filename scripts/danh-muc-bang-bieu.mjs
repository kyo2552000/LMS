/**
 * Script: danh-muc-bang-bieu.mjs
 * Mục đích:
 *   1) Quét toàn bộ đoạn văn có caption bảng (bắt đầu bằng "Bảng X..." hoặc trong tbl)
 *   2) Gán style "Caption" cho các đoạn đó
 *   3) Tìm vị trí "DANH MỤC BẢNG BIỂU" trong tài liệu
 *   4) Chèn TOF field tự cập nhật tại đó
 *   5) Nếu chưa có phần "DANH MỤC BẢNG BIỂU", tạo mới và chèn vào đầu tài liệu
 *
 * Sau khi xử lý: Mở Word → Ctrl+A → F9 → "Update entire table"
 */

import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const INPUT  = path.join(ROOT, "Báo cáo 2.docx");
const OUTPUT = path.join(ROOT, "Báo cáo 2 (final).docx");

const CAPTION_STYLE_ID   = "Caption";
const CAPTION_STYLE_NAME = "Caption";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractText(xml) {
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map(m => m[1]).join("").trim();
}

function isBangCaption(text) {
  // Bắt "Bảng 1:", "Bảng 1.1:", "Bảng 2.3 –", "Bảng 4 ."...
  return /^Bảng\s+\d/.test(text);
}

// Đảm bảo style Caption tồn tại trong styles.xml
function ensureCaptionStyle(stylesXml) {
  if (stylesXml.includes(`w:styleId="${CAPTION_STYLE_ID}"`)) return stylesXml;

  const def = `
  <w:style w:type="paragraph" w:styleId="${CAPTION_STYLE_ID}">
    <w:name w:val="${CAPTION_STYLE_NAME}"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="left"/>
      <w:spacing w:before="60" w:after="60"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>`;

  return stylesXml.replace("</w:styles>", def + "\n</w:styles>");
}

// Gán style Caption cho đoạn văn
function applyCaption(paraXml) {
  const styleTag = `<w:pStyle w:val="${CAPTION_STYLE_ID}"/>`;
  if (paraXml.includes(styleTag)) return paraXml; // Đã có

  if (/<w:pPr>/.test(paraXml)) {
    return paraXml.replace(/<w:pPr>/, `<w:pPr>${styleTag}`);
  }
  return paraXml.replace(/(<w:p[ >][^>]*>)/, `$1<w:pPr>${styleTag}</w:pPr>`);
}

// Tạo XML tiêu đề "DANH MỤC BẢNG BIỂU"
function buildDanhMucHeading() {
  return `<w:p>
  <w:pPr>
    <w:pStyle w:val="Heading1"/>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:b/><w:bCs/>
      <w:caps/>
      <w:sz w:val="28"/><w:szCs w:val="28"/>
    </w:rPr>
    <w:t>DANH MỤC BẢNG BIỂU</w:t>
  </w:r>
</w:p>`;
}

// Tạo TOF field tự động lấy tất cả đoạn có style Caption
function buildTOFField() {
  // TOC \h \z \t "Caption,1"  →  lấy tất cả đoạn style Caption thành danh mục có số trang
  const instruction = `TOC \\h \\z \\t "${CAPTION_STYLE_ID},1"`;
  return `<w:p>
  <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
  <w:r>
    <w:rPr><w:noProof/></w:rPr>
    <w:fldChar w:fldCharType="begin" w:dirty="true"/>
  </w:r>
  <w:r>
    <w:rPr><w:noProof/></w:rPr>
    <w:instrText xml:space="preserve"> ${instruction} </w:instrText>
  </w:r>
  <w:r>
    <w:rPr><w:noProof/></w:rPr>
    <w:fldChar w:fldCharType="separate"/>
  </w:r>
  <w:r>
    <w:rPr><w:noProof/><w:color w:val="808080"/></w:rPr>
    <w:t>(Mở Word → Ctrl+A → F9 để cập nhật danh mục)</w:t>
  </w:r>
  <w:r>
    <w:rPr><w:noProof/></w:rPr>
    <w:fldChar w:fldCharType="end"/>
  </w:r>
</w:p>`;
}

// Đoạn trống ngăn cách
function emptyPara() {
  return `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr></w:p>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`Không tìm thấy file: ${INPUT}`);
  }

  console.log("📖 Đọc file:", INPUT);
  const zip = await JSZip.loadAsync(fs.readFileSync(INPUT));

  // 1) Cập nhật styles.xml
  let stylesXml = await zip.file("word/styles.xml").async("string");
  stylesXml = ensureCaptionStyle(stylesXml);
  zip.file("word/styles.xml", stylesXml);
  console.log("✔ Đảm bảo style Caption trong styles.xml");

  // 2) Đọc document.xml
  let docXml = await zip.file("word/document.xml").async("string");
  const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;

  // --- Bước 2a: Thu thập tất cả paragraph (từ cuối lên để offset không lệch)
  let allParas = [];
  let pm;
  const re1 = new RegExp(paraRegex.source, "g");
  while ((pm = re1.exec(docXml)) !== null) {
    allParas.push({ raw: pm[0], offset: pm.index });
  }
  console.log(`📊 Tổng số đoạn văn: ${allParas.length}`);

  // --- Bước 2b: Gán style Caption cho các caption bảng (xử lý từ cuối → đầu)
  let captionCount = 0;
  const captionTexts = []; // Lưu tên bảng để log

  for (let i = allParas.length - 1; i >= 0; i--) {
    const { raw, offset } = allParas[i];
    const text = extractText(raw);

    if (isBangCaption(text)) {
      const newPara = applyCaption(raw);
      if (newPara !== raw) {
        docXml = docXml.substring(0, offset) + newPara + docXml.substring(offset + raw.length);
        captionCount++;
        captionTexts.unshift(`  [${captionCount}] ${text.substring(0, 80)}`);
      }
    }
  }
  console.log(`✔ Đã gán style Caption cho ${captionCount} bảng:`);
  captionTexts.forEach(t => console.log(t));

  // --- Bước 2c: Tìm vị trí "DANH MỤC BẢNG BIỂU" trong tài liệu ---
  let danhMucOffset = -1;
  let danhMucRaw = "";
  const re2 = new RegExp(paraRegex.source, "g");
  let pm2;
  while ((pm2 = re2.exec(docXml)) !== null) {
    const t = extractText(pm2[0]);
    if (t.includes("DANH MỤC BẢNG BIỂU") || t.includes("DANH MUC BANG BIEU")) {
      danhMucOffset = pm2.index;
      danhMucRaw = pm2[0];
      console.log(`✔ Tìm thấy heading "DANH MỤC BẢNG BIỂU" tại offset: ${danhMucOffset}`);
      break;
    }
  }

  const tofXml = buildTOFField();

  if (danhMucOffset >= 0) {
    // Tìm bảng hoặc đoạn nội dung thủ công sau heading để thay thế
    // Tìm vị trí ngay sau heading DANH MỤC
    const afterHeading = danhMucOffset + danhMucRaw.length;

    // Tìm bảng <w:tbl> đầu tiên sau heading (nếu có) để xóa
    const tblRegex = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
    tblRegex.lastIndex = afterHeading;
    let tblMatch = tblRegex.exec(docXml);

    if (tblMatch && tblMatch.index < afterHeading + 5000) {
      // Thay thế bảng thủ công bằng TOF field
      docXml = docXml.substring(0, tblMatch.index)
               + tofXml
               + docXml.substring(tblMatch.index + tblMatch[0].length);
      console.log("✔ Đã thay bảng DANH MỤC thủ công bằng TOF field");
    } else {
      // Chèn TOF ngay sau heading
      docXml = docXml.substring(0, afterHeading)
               + tofXml
               + docXml.substring(afterHeading);
      console.log("✔ Đã chèn TOF field ngay sau heading DANH MỤC BẢNG BIỂU");
    }
  } else {
    // Chưa có phần DANH MỤC BẢNG BIỂU → tạo mới, chèn vào sau mục lục (trước Chương 1)
    console.log("⚠️  Không tìm thấy heading DANH MỤC BẢNG BIỂU → Tạo mới và chèn vào tài liệu");

    // Tìm vị trí CHƯƠNG 1 để chèn trước nó
    const re3 = new RegExp(paraRegex.source, "g");
    let pm3;
    let ch1Offset = -1;
    let ch1Raw = "";
    while ((pm3 = re3.exec(docXml)) !== null) {
      const t = extractText(pm3[0]);
      const style = (pm3[0].match(/w:pStyle w:val="([^"]+)"/) || [])[1] || "";
      if (style === "Heading2" && t.includes("CHƯƠNG 1")) {
        ch1Offset = pm3.index;
        ch1Raw = pm3[0];
        break;
      }
    }

    const newSection = buildDanhMucHeading() + "\n" + tofXml + "\n" + emptyPara();

    if (ch1Offset >= 0) {
      // Chèn một page break + DANH MỤC ngay trước Chương 1
      const pageBreak = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
      docXml = docXml.substring(0, ch1Offset)
               + newSection + "\n" + pageBreak + "\n"
               + docXml.substring(ch1Offset);
      console.log("✔ Đã tạo mới DANH MỤC BẢNG BIỂU và chèn trước CHƯƠNG 1");
    } else {
      // Fallback: chèn vào đầu body
      const bodyStart = docXml.indexOf("<w:body>") + "<w:body>".length;
      docXml = docXml.substring(0, bodyStart) + "\n" + newSection + "\n" + docXml.substring(bodyStart);
      console.log("✔ Đã chèn DANH MỤC BẢNG BIỂU vào đầu tài liệu");
    }
  }

  // 3) Ghi file output
  zip.file("word/document.xml", docXml);
  const outBuf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(OUTPUT, outBuf);

  console.log("\n✅ XONG! File đã lưu tại:");
  console.log("  ", OUTPUT);
  console.log("\n📌 HƯỚNG DẪN SAU KHI MỞ TRONG WORD:");
  console.log("   1. Mở file Word vừa tạo");
  console.log("   2. Nhấn Ctrl+A (chọn tất cả)");
  console.log("   3. Nhấn F9 (cập nhật field)");
  console.log("   4. Chọn 'Update entire table' khi được hỏi");
  console.log("   => Danh mục bảng biểu sẽ tự điền đúng số trang!\n");
}

main().catch(e => {
  console.error("❌ Lỗi:", e.message || e);
  process.exit(1);
});
