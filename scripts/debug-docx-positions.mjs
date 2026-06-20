// Script debug: In ra các đoạn văn xung quanh vị trí chèn để kiểm tra
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_IN = path.join(ROOT, "Báo cáo 2.docx");

function decodeXml(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

function paragraphText(paragraphXml) {
  return [...paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((m) => decodeXml(m[1])).join("").trim();
}

function getStyle(paragraphXml) {
  const m = paragraphXml.match(/w:pStyle w:val="([^"]+)"/);
  return m ? m[1] : "(default)";
}

async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(DOC_IN));
  let xml = await zip.file("word/document.xml").async("string");
  const paragraphRegex = /<w:p[\s\S]*?<\/w:p>/g;
  const paragraphs = [...xml.matchAll(paragraphRegex)].map((m) => m[0]);

  console.log("=== Các đoạn có chứa từ khóa CHUONG / Chương / 1. ===");
  for (let i = 0; i < paragraphs.length; i++) {
    const t = paragraphText(paragraphs[i]);
    const style = getStyle(paragraphs[i]);
    if (t.match(/chương|CHƯƠNG|CHUONG|^1\.|^2\./i) && t.length < 200) {
      console.log(`[${i}] style=${style} | "${t.substring(0,120)}"`);
    }
  }
}

main().catch(console.error);
