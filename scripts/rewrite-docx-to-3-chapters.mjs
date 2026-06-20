import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_PATH = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.docx");

const chapterNumberMap = {
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 2,
    6: 3,
    7: 3,
};

const chapterTitleMap = {
    1: "CHƯƠNG 1: CƠ SỞ LÝ THUYẾT",
    3: "CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG",
    6: "CHƯƠNG 3: CÀI ĐẶT VÀ KIỂM THỬ HỆ THỐNG",
};

function decodeXml(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

function encodeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function extractParagraphText(paragraphXml) {
    const parts = [...paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => decodeXml(m[1]));
    return parts.join("");
}

function replaceParagraphText(paragraphXml, newText) {
    const escaped = encodeXml(newText);
    let replaced = false;
    const out = paragraphXml.replace(/<w:t([^>]*)>[\s\S]*?<\/w:t>/g, (m, attrs) => {
        if (replaced) return "";
        replaced = true;
        return `<w:t${attrs}>${escaped}</w:t>`;
    });
    return out;
}

function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
}

function rewriteParagraphText(text) {
    const normalized = normalizeText(text);
    if (!normalized || /PAGEREF|TOC|Mục Lục|MỤC LỤC/i.test(normalized)) {
        return { changed: false, text };
    }

    const chapterMatch = normalized.match(/^CH(?:Ư|U)ƠNG\s+([1-7])\s*:/i);
    if (chapterMatch) {
        const oldChapter = Number(chapterMatch[1]);
        if (oldChapter === 2 || oldChapter === 4 || oldChapter === 5 || oldChapter === 7) {
            return { changed: true, text: "" };
        }
        const title = chapterTitleMap[oldChapter];
        if (title) return { changed: title !== text, text: title };
    }

    const sectionMatch = normalized.match(/^([1-7])(\.\d+(?:\.\d+)*)(.*)$/);
    if (sectionMatch) {
        const oldChapter = Number(sectionMatch[1]);
        const newChapter = chapterNumberMap[oldChapter];
        if (!newChapter) return { changed: false, text };
        const rewritten = `${newChapter}${sectionMatch[2]}${sectionMatch[3]}`;
        return { changed: rewritten !== normalized, text: rewritten };
    }

    return { changed: false, text };
}

async function main() {
    if (!fs.existsSync(DOC_PATH)) throw new Error(`Khong tim thay file: ${DOC_PATH}`);

    const backupPath = path.join(ROOT, `BaoCaoTotNghiep_EduLearn.backup-before-3chap-${Date.now()}.docx`);
    fs.copyFileSync(DOC_PATH, backupPath);

    const zip = await JSZip.loadAsync(fs.readFileSync(DOC_PATH));
    const docFile = zip.file("word/document.xml");
    if (!docFile) throw new Error("Khong tim thay word/document.xml");

    let xml = await docFile.async("string");
    const paragraphs = [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)].map((m) => m[0]);

    let changedCount = 0;
    let removedParagraphs = 0;
    const rewritten = paragraphs
        .map((p) => {
            const rawText = extractParagraphText(p);
            const { changed, text } = rewriteParagraphText(rawText);
            if (!changed) return p;
            changedCount += 1;
            if (text === "") {
                removedParagraphs += 1;
                return "";
            }
            return replaceParagraphText(p, text);
        })
        .filter(Boolean);

    let idx = 0;
    xml = xml.replace(/<w:p[\s\S]*?<\/w:p>/g, () => rewritten[idx++] ?? "");

    zip.file("word/document.xml", xml);
    const out = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });
    fs.writeFileSync(DOC_PATH, out);

    console.log("Da backup:", backupPath);
    console.log("Da cap nhat 3 chuong. So doan sua:", changedCount);
    console.log("So tieu de chuong trung gian da xoa:", removedParagraphs);
}

main().catch((err) => {
    console.error("Loi:", err.message || err);
    process.exit(1);
});
