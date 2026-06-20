/**
 * Quét TẤT CẢ thẻ <w:tbl> trong docx và in ra:
 * - Đoạn trước bảng (tiêu đề/caption)
 * - Đoạn sau bảng
 * - Nội dung dòng đầu tiên trong bảng
 */
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const allDocx = fs.readdirSync(ROOT).filter(f => f.endsWith(".docx"));
const inputFile = allDocx.find(f => f.includes("o 2") && !f.includes("final") && !f.includes("Final") && !f.includes("có"))
  || allDocx.find(f => f.includes("o 2") && !f.includes("final"));
const INPUT = path.join(ROOT, inputFile);
console.log("📖 Đọc:", inputFile, "\n");

function extractText(xml) {
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map(m => m[1]).join("").trim();
}

async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(INPUT));
  const docXml = await zip.file("word/document.xml").async("string");

  // Tách toàn bộ nội dung thành các khối (para + tbl)
  // Dùng regex để lấy tất cả <w:p> và <w:tbl>
  const blockRe = /(<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>)/g;
  const blocks = [];
  let m;
  while ((m = blockRe.exec(docXml)) !== null) {
    const isTable = m[0].startsWith("<w:tbl>");
    blocks.push({ type: isTable ? "tbl" : "para", raw: m[0], offset: m.index });
  }

  console.log(`Tổng: ${blocks.filter(b=>b.type==="tbl").length} bảng, ${blocks.filter(b=>b.type==="para").length} đoạn văn\n`);
  console.log("=" .repeat(80));

  let tblIdx = 0;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type !== "tbl") continue;
    tblIdx++;

    // Lấy 3 đoạn trước bảng
    const beforeParas = [];
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      if (blocks[j].type === "para") {
        const t = extractText(blocks[j].raw);
        if (t) beforeParas.unshift(t);
      }
    }

    // Dòng đầu tiên của bảng (tìm <w:tr> đầu tiên)
    const firstRowMatch = blocks[i].raw.match(/<w:tr[ >][\s\S]*?<\/w:tr>/);
    const firstRowText = firstRowMatch ? extractText(firstRowMatch[0]).substring(0, 100) : "(không có)";

    // Đoạn sau bảng
    let afterText = "";
    for (let j = i + 1; j < Math.min(blocks.length, i + 3); j++) {
      if (blocks[j].type === "para") {
        const t = extractText(blocks[j].raw);
        if (t) { afterText = t; break; }
      }
    }

    console.log(`\n📋 BẢNG #${tblIdx} (offset: ${blocks[i].offset})`);
    console.log(`   Trước: ${beforeParas.map((t,i)=>`[${i+1}] "${t.substring(0,70)}"`).join(" | ")}`);
    console.log(`   Row1:  "${firstRowText}"`);
    console.log(`   Sau:   "${afterText.substring(0,70)}"`);
  }
}

main().catch(console.error);
