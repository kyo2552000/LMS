import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_PATH = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.docx");

const CH1_OLD = "CHƯƠNG 1: GIỚI THIỆU ĐỀ TÀI";
const CH1_NEW = "CHƯƠNG 1: CƠ SỞ LÝ THUYẾT";
const CH2_OLD = "CHƯƠNG 2: KHẢO SÁT HIỆN TRẠNG";

const NEW_SECTIONS = [
    "Tổng quan",
    "Khái niệm",
    "Đặc điểm",
    "Công nghệ nền tảng",
    "Cơ sở dữ liệu",
    "Hệ thống thanh toán trực tuyến",
    "Trí tuệ nhân tạo",
    "Bảo mật ứng dụng web",
    "Công nghệ nền tảng: ASP.NET Core",
];

function paragraph(text) {
    return `<w:p><w:r><w:t xml:space="preserve">${text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</w:t></w:r></w:p>`;
}

function replaceNth(input, search, replacement, nth) {
    let idx = -1;
    let from = 0;
    for (let i = 0; i < nth; i++) {
        idx = input.indexOf(search, from);
        if (idx === -1) return { ok: false, output: input };
        from = idx + search.length;
    }
    return {
        ok: true,
        output: input.slice(0, idx) + replacement + input.slice(idx + search.length),
    };
}

async function main() {
    if (!fs.existsSync(DOC_PATH)) {
        throw new Error(`Khong tim thay file: ${DOC_PATH}`);
    }

    const backup = path.join(ROOT, `BaoCaoTotNghiep_EduLearn.backup-before-chapter-merge-${Date.now()}.docx`);
    fs.copyFileSync(DOC_PATH, backup);

    const zip = await JSZip.loadAsync(fs.readFileSync(DOC_PATH));
    const docFile = zip.file("word/document.xml");
    if (!docFile) throw new Error("Khong tim thay word/document.xml");

    let xml = await docFile.async("string");

    // 1) Doi tieu de CHUONG 1 trong phan noi dung (lan xuat hien thu 2, lan 1 o Muc luc).
    const r1 = replaceNth(xml, CH1_OLD, CH1_NEW, 2);
    if (!r1.ok) throw new Error("Khong tim thay tieu de CHUONG 1 trong noi dung.");
    xml = r1.output;

    // 2) Xoa dong tieu de CHUONG 2 trong phan noi dung (lan xuat hien thu 2).
    const pRegex = /<w:p[\s\S]*?<\/w:p>/g;
    const paragraphs = xml.match(pRegex);
    if (!paragraphs) throw new Error("Khong doc duoc cac doan van.");

    let ch1BodyIndex = -1;
    let ch2BodyIndex = -1;
    let ch1Count = 0;
    let ch2Count = 0;

    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        if (p.includes(CH1_NEW) || p.includes(CH1_OLD)) {
            ch1Count += 1;
            if (ch1Count === 2) ch1BodyIndex = i;
        }
        if (p.includes(CH2_OLD)) {
            ch2Count += 1;
            if (ch2Count === 2) ch2BodyIndex = i;
        }
    }

    if (ch1BodyIndex === -1) throw new Error("Khong xac dinh duoc doan CHUONG 1 trong noi dung.");
    if (ch2BodyIndex === -1) throw new Error("Khong xac dinh duoc doan CHUONG 2 trong noi dung.");

    const sectionBlock = NEW_SECTIONS.map((s, idx) => paragraph(`1.${idx + 1} ${s}`)).join("");

    const updatedParagraphs = paragraphs.filter((_, idx) => idx !== ch2BodyIndex);
    updatedParagraphs.splice(ch1BodyIndex + 1, 0, sectionBlock);
    xml = xml.replace(pRegex, () => updatedParagraphs.shift() ?? "");

    zip.file("word/document.xml", xml);
    const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
    fs.writeFileSync(DOC_PATH, out);

    console.log("Da backup:", backup);
    console.log("Da cap nhat gop CHUONG 1 + 2 vao CHUONG 1.");
}

main().catch((err) => {
    console.error("Loi:", err.message || err);
    process.exit(1);
});
