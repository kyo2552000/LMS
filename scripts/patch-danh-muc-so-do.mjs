/**
 * Patch Word report:
 * - Bật updateFields để Word tự cập nhật (TOC, Table of Figures) khi mở file
 * - Thay phần "DANH MỤC BẢNG BIỂU VÀ SƠ ĐỒ" bằng Table of Figures (1 danh mục chung)
 *
 * Lưu ý: Word chỉ liệt kê các hình có Caption đúng chuẩn (label Figure).
 * Nếu tài liệu hiện tại dùng caption thủ công (chỉ gõ chữ "Hình ..."), danh mục có thể rỗng
 * cho đến khi bạn chuyển các dòng đó sang Insert Caption trong Word.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DOC_PATH = path.join(ROOT, "BaoCaoTotNghiep_EduLearn_Final.docx");
const BACKUP_PATH = path.join(ROOT, "BaoCaoTotNghiep_EduLearn_Final.backup-before-figures-list.docx");

const BM_ID = "87654322";
const BM_START = `<w:bookmarkStart w:id="${BM_ID}" w:name="_EdlearnFigureList"/>`;
const BM_END = `<w:bookmarkEnd w:id="${BM_ID}"/>`;

function ensureUpdateFields(settingsXml) {
  if (settingsXml.includes("w:updateFields")) return settingsXml;
  // Chèn ngay sau <w:settings ...>
  return settingsXml.replace(
    /<w:settings\b[^>]*>/,
    (m) => `${m}<w:updateFields w:val="true"/>`
  );
}

function buildTableOfFiguresField() {
  // Field Table of Figures: TOC \\h \\z \\c \"Figure\"
  // Kết quả sẽ được Word cập nhật khi mở file (do updateFields=true)
  const instr = ` TOC \\\\h \\\\z \\\\c \"Figure\" `;
  return (
    BM_START +
    `<w:p>
      <w:r><w:fldChar w:fldCharType="begin"/></w:r>
      <w:r><w:instrText xml:space="preserve">${instr}</w:instrText></w:r>
      <w:r><w:fldChar w:fldCharType="separate"/></w:r>
      <w:r><w:t>Danh mục sẽ tự cập nhật khi mở bằng Microsoft Word.</w:t></w:r>
      <w:r><w:fldChar w:fldCharType="end"/></w:r>
    </w:p>` +
    BM_END
  );
}

function patchDocumentXml(documentXml) {
  // Xóa lần chèn cũ (nếu có)
  const reOld = new RegExp(
    `<w:bookmarkStart[^>]*w:id="${BM_ID}"[^>]*/>[\\s\\S]*?<w:bookmarkEnd w:id="${BM_ID}"\\s*/>`,
    "g"
  );
  let xml = documentXml.replace(reOld, "");

  const heading = "DANH MỤC BẢNG BIỂU VÀ SƠ ĐỒ";
  const hits = [];
  let idx = -1;
  while (true) {
    idx = xml.indexOf(heading, idx + 1);
    if (idx === -1) break;
    hits.push(idx);
  }
  if (hits.length < 2) throw new Error(`Không tìm thấy heading '${heading}' trong body.`);

  // Lần xuất hiện thứ 1 thường nằm trong TOC, lần thứ 2 là heading thật trong body
  const bodyIdx = hits[1];

  // Tìm đoạn <w:p ...> chứa heading và kết thúc </w:p>
  const pStart = xml.lastIndexOf("<w:p", bodyIdx);
  const pEnd = xml.indexOf("</w:p>", bodyIdx);
  if (pStart === -1 || pEnd === -1) throw new Error("Không xác định được paragraph heading.");
  const afterHeading = pEnd + "</w:p>".length;

  // Nếu ngay sau đó có bảng thủ công (w:tbl) thì loại bỏ để thay bằng field tự động
  let rest = xml.slice(afterHeading);
  if (rest.startsWith("<w:tbl")) {
    const tblEnd = rest.indexOf("</w:tbl>");
    if (tblEnd !== -1) {
      rest = rest.slice(tblEnd + "</w:tbl>".length);
    }
  }

  const fieldBlock = buildTableOfFiguresField();
  return xml.slice(0, afterHeading) + fieldBlock + rest;
}

async function main() {
  if (!fs.existsSync(DOC_PATH)) throw new Error(`Không thấy file: ${DOC_PATH}`);
  if (!fs.existsSync(BACKUP_PATH)) fs.copyFileSync(DOC_PATH, BACKUP_PATH);

  const buf = fs.readFileSync(DOC_PATH);
  const zip = await JSZip.loadAsync(buf);

  const settingsPath = "word/settings.xml";
  const documentPath = "word/document.xml";
  const settingsXml = await zip.file(settingsPath).async("string");
  const documentXml = await zip.file(documentPath).async("string");

  zip.file(settingsPath, ensureUpdateFields(settingsXml));
  zip.file(documentPath, patchDocumentXml(documentXml));

  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(DOC_PATH, out);
  console.log("✅ Patched figures list + updateFields:", DOC_PATH);
}

main().catch((e) => {
  console.error("❌ Patch failed:", e?.message || e);
  process.exit(1);
});

