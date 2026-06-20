import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Tìm file docx đầu tiên trong thư mục gốc
const files = fs.readdirSync(ROOT).filter(f => f.endsWith(".docx"));
console.log("Các file .docx tìm thấy:", files);

// Dùng file Báo cáo 2.docx
const docxFile = files.find(f => f.includes("o c") && f.includes("o 2") && !f.includes("final") && !f.includes("Final"));
if (!docxFile) { console.error("Không tìm thấy file báo cáo 2!"); process.exit(1); }

const INPUT = path.join(ROOT, docxFile);
console.log("Đọc:", INPUT);

async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(INPUT));
  const xml = await zip.file("word/document.xml").async("string");
  const re = /<w:p[ >][\s\S]*?<\/w:p>/g;
  let m;
  const bangItems = [];
  const allCaptions = [];

  while ((m = re.exec(xml)) !== null) {
    const t = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(x => x[1]).join("").trim();
    if (t.length > 3 && t.length < 200) {
      if (/^B[aả]ng\s/i.test(t)) bangItems.push(t);
      if (/^(H[iì]nh|S[oơ]\s*đồ|Bi[eê]u\s*đồ|B[aả]ng)\s+\d/i.test(t)) allCaptions.push(t);
    }
  }

  console.log("\n=== TẤT CẢ CAPTION CÓ SỐ ===");
  allCaptions.forEach((t, i) => console.log(` ${i+1}. ${t}`));

  console.log("\n=== CHỈ BẢNG ===");
  bangItems.forEach((t, i) => console.log(` ${i+1}. ${t}`));
  console.log(`\nTổng: ${bangItems.length} bảng, ${allCaptions.length} caption có số`);
}

main().catch(console.error);
