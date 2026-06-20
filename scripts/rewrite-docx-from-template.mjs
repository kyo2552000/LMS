import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TARGET_DOC = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.docx");
const OUTPUT_DOC = path.join(ROOT, "BaoCaoTotNghiep_EduLearn.rewrite-from-Nhom2.docx");
const BACKUP_PREFIX = "BaoCaoTotNghiep_EduLearn.backup-before-rewrite-";

function findTemplateDocx() {
    const entries = fs.readdirSync(ROOT);
    const docxFiles = entries.filter((name) => /\.docx$/i.test(name));

    const exact = docxFiles.find((name) => name.toLowerCase() === "nhóm 2.docx");
    if (exact) return path.join(ROOT, exact);

    const loose = docxFiles.find((name) => /nh.m\s*2\.docx$/i.test(name));
    if (loose) return path.join(ROOT, loose);

    throw new Error("Khong tim thay file mau 'Nhóm 2.docx' trong thu muc goc.");
}

function timestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function readZip(filePath) {
    const buf = fs.readFileSync(filePath);
    return JSZip.loadAsync(buf);
}

async function copyXmlIfExists(fromZip, toZip, filePath) {
    const f = fromZip.file(filePath);
    if (!f) return false;
    const xml = await f.async("string");
    toZip.file(filePath, xml);
    return true;
}

async function replaceSectionPropsFromTemplate(templateZip, targetZip) {
    const templateDoc = templateZip.file("word/document.xml");
    const targetDoc = targetZip.file("word/document.xml");
    if (!templateDoc || !targetDoc) return false;

    const templateXml = await templateDoc.async("string");
    const targetXml = await targetDoc.async("string");

    const templateSect = templateXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
    const targetSect = targetXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
    if (!templateSect || !targetSect) return false;

    const merged = targetXml.replace(targetSect[0], templateSect[0]);
    targetZip.file("word/document.xml", merged);
    return true;
}

async function main() {
    if (!fs.existsSync(TARGET_DOC)) {
        throw new Error(`Khong thay file dich: ${TARGET_DOC}`);
    }

    const templateDoc = findTemplateDocx();
    const [templateZip, targetZip] = await Promise.all([readZip(templateDoc), readZip(TARGET_DOC)]);

    const styleLikeFiles = [
        "word/styles.xml",
        "word/theme/theme1.xml",
        "word/fontTable.xml",
        "word/settings.xml",
        "word/webSettings.xml",
        "word/numbering.xml",
    ];

    const copied = [];
    for (const filePath of styleLikeFiles) {
        const ok = await copyXmlIfExists(templateZip, targetZip, filePath);
        if (ok) copied.push(filePath);
    }

    const replacedSectPr = await replaceSectionPropsFromTemplate(templateZip, targetZip);

    const outBuf = await targetZip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });

    fs.writeFileSync(OUTPUT_DOC, outBuf);

    const backupPath = path.join(ROOT, `${BACKUP_PREFIX}${timestamp()}.docx`);
    try {
        fs.copyFileSync(TARGET_DOC, backupPath);
        console.log("Da sao luu:", backupPath);
    } catch (err) {
        console.log("Khong the sao luu file dang mo (bo qua):", err.code || err.message);
    }
    console.log("Da ap dung mau tu:", path.basename(templateDoc));
    console.log("Da tao file moi:", OUTPUT_DOC);
    console.log("Cac file da dong bo:", copied.join(", ") || "(khong co)");
    console.log("Da thay sectPr:", replacedSectPr ? "co" : "khong");
}

main().catch((err) => {
    console.error("Loi:", err.message || err);
    process.exit(1);
});
