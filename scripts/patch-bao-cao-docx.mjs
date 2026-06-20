/**
 * Chèn / thay khối "đối chiếu codebase" vào cuối document.xml của file .docx
 * (trước w:sectPr). Dùng comment markers để lần sau chạy lại sẽ ghi đè khối cũ.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DOC_IN = path.join(ROOT, "BaoCaoTotNghiep_EduLearn_Final.docx");
const DOC_BACKUP = path.join(ROOT, "BaoCaoTotNghiep_EduLearn_Final.backup-before-docx-patch.docx");
const MD_SRC = path.join(ROOT, "BaoCao_EduLearn_NoiDung_Theo_Codebase.md");

/** ID cố định để xóa khối cũ khi chạy lại (bookmark OOXML) */
const BM_ID = "87654321";
const BM_START = `<w:bookmarkStart w:id="${BM_ID}" w:name="_EdlearnCodebasePatch"/>`;
const BM_END = `<w:bookmarkEnd w:id="${BM_ID}"/>`;

function stripMdMarkers(s) {
    return String(s)
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1");
}

function escapeXml(s) {
    return stripMdMarkers(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** OOXML w:sz is half-points */
function paragraph(text, { bold = false, sz = null } = {}) {
    let rPr = "";
    if (bold || sz) {
        rPr = "<w:rPr>";
        if (bold) rPr += "<w:b/>";
        if (sz) rPr += `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
        rPr += "</w:rPr>";
    }
    return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function pageBreak() {
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function markdownToParagraphs(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const out = [];

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) continue;
        if (line.trim() === "---") continue;
        if (line.startsWith("|") && line.includes("|")) {
            const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
            out.push(paragraph(cells.join(" — "), { sz: 22 }));
            continue;
        }
        if (line.startsWith("### ")) {
            out.push(paragraph(line.slice(4), { bold: true, sz: 28 }));
            continue;
        }
        if (line.startsWith("## ")) {
            out.push(paragraph(line.slice(3), { bold: true, sz: 32 }));
            continue;
        }
        if (line.startsWith("# ")) {
            out.push(paragraph(line.slice(2), { bold: true, sz: 36 }));
            continue;
        }
        if (line.startsWith("- ")) {
            out.push(paragraph("• " + line.slice(2), { sz: 24 }));
            continue;
        }
        out.push(paragraph(line, { sz: 24 }));
    }
    return out.join("");
}

function buildPatchBody(md) {
    const intro =
        paragraph(
            "PHẦN BỔ SUNG THEO MÃ NGUỒN HIỆN TẠI (cập nhật tự động — có thể xóa khối này nếu đã chèn vào chương chính).",
            { bold: true, sz: 36 }
        ) +
        paragraph(`Nguồn: BaoCao_EduLearn_NoiDung_Theo_Codebase.md + BACKEND.md / FRONTEND.md. Thời điểm chèn: ${new Date().toISOString().slice(0, 10)}.`, {
            sz: 22,
        });

    return pageBreak() + BM_START + intro + markdownToParagraphs(md) + BM_END;
}

async function main() {
    if (!fs.existsSync(DOC_IN)) {
        console.error("Không thấy file:", DOC_IN);
        process.exit(1);
    }
    if (!fs.existsSync(MD_SRC)) {
        console.error("Không thấy file:", MD_SRC);
        process.exit(1);
    }

    const md = fs.readFileSync(MD_SRC, "utf8");
    const patchInner = buildPatchBody(md);

    if (!fs.existsSync(DOC_BACKUP)) {
        fs.copyFileSync(DOC_IN, DOC_BACKUP);
        console.log("Đã sao lưu:", DOC_BACKUP);
    }

    const buf = fs.readFileSync(DOC_IN);
    const zip = await JSZip.loadAsync(buf);
    const docPath = "word/document.xml";
    let xml = await zip.file(docPath).async("string");

    xml = xml.replace(
        new RegExp(
            `<w:bookmarkStart[^>]*w:id="${BM_ID}"[^>]*/>[\\s\\S]*?<w:bookmarkEnd w:id="${BM_ID}"/>`,
            "g"
        ),
        ""
    );

    const sectIdx = xml.lastIndexOf("<w:sectPr");
    if (sectIdx === -1) {
        console.error("Không tìm thấy <w:sectPr trong document.xml");
        process.exit(1);
    }

    const newXml = xml.slice(0, sectIdx) + patchInner + xml.slice(sectIdx);
    zip.file(docPath, newXml);

    const outBuf = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });

    fs.writeFileSync(DOC_IN, outBuf);
    console.log("Đã cập nhật:", DOC_IN);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
