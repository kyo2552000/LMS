import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_PATH = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.docx");

const CH2_TITLE = "CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG";
const CH3_TITLE = "CHƯƠNG 3: CÀI ĐẶT VÀ KIỂM THỬ HỆ THỐNG";

function decodeXml(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}
function encodeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function textOfParagraph(p) {
    return [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => decodeXml(m[1])).join("").trim();
}
function setParagraphText(p, text) {
    const escaped = encodeXml(text);
    let done = false;
    return p.replace(/<w:t([^>]*)>[\s\S]*?<\/w:t>/g, (_m, attrs) => {
        if (done) return "";
        done = true;
        return `<w:t${attrs}>${escaped}</w:t>`;
    });
}
function newParagraph(text) {
    return `<w:p><w:r><w:t xml:space="preserve">${encodeXml(text)}</w:t></w:r></w:p>`;
}

async function main() {
    const backup = path.join(ROOT, `BaoCaoTotNghiep_EduLearn.backup-before-fix-headings-${Date.now()}.docx`);
    fs.copyFileSync(DOC_PATH, backup);

    const zip = await JSZip.loadAsync(fs.readFileSync(DOC_PATH));
    const file = zip.file("word/document.xml");
    if (!file) throw new Error("Khong tim thay word/document.xml");
    let xml = await file.async("string");

    let paragraphs = [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)].map((m) => m[0]);

    // Ensure CH2 title appears before first "2.1 ..."
    const firstSection2 = paragraphs.findIndex((p) => /^2\.1(\D|$)/.test(textOfParagraph(p)));
    if (firstSection2 !== -1) {
        let prevHeadingIdx = -1;
        for (let i = firstSection2 - 1; i >= 0; i--) {
            const t = textOfParagraph(paragraphs[i]);
            if (/^CH(?:Ư|U)ƠNG\s+\d+\s*:/i.test(t)) {
                prevHeadingIdx = i;
                break;
            }
        }
        const needInsert = prevHeadingIdx === -1 || textOfParagraph(paragraphs[prevHeadingIdx]) !== CH2_TITLE;
        if (needInsert) {
            paragraphs.splice(firstSection2, 0, newParagraph(CH2_TITLE));
        }
    }

    // The chapter title before first "3.1 ..." should be CH3.
    const firstSection3 = paragraphs.findIndex((p) => /^3\.1(\D|$)/.test(textOfParagraph(p)));
    if (firstSection3 !== -1) {
        for (let i = firstSection3 - 1; i >= 0; i--) {
            const t = textOfParagraph(paragraphs[i]);
            if (/^CH(?:Ư|U)ƠNG\s+\d+\s*:/i.test(t)) {
                paragraphs[i] = setParagraphText(paragraphs[i], CH3_TITLE);
                break;
            }
        }
    }

    let idx = 0;
    xml = xml.replace(/<w:p[\s\S]*?<\/w:p>/g, () => paragraphs[idx++] ?? "");
    zip.file("word/document.xml", xml);
    const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
    fs.writeFileSync(DOC_PATH, out);

    console.log("Da backup:", backup);
    console.log("Da sua lai tieu de chuong 2 va 3.");
}

main().catch((e) => {
    console.error("Loi:", e.message || e);
    process.exit(1);
});
