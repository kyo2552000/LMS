import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    AlignmentType, 
    HeadingLevel, 
    SectionType, 
    PageBreak, 
    Footer, 
    PageNumber, 
    NumberFormat, 
    TextDirection,
    Header
} from "docx";
import * as fs from "fs";

// ==========================================
// CẤU HÌNH QUY CÁCH (THEO HƯỚNG DẪN)
// ==========================================
const CONFIG = {
    font: "Times New Roman",
    size: {
        normal: 26,    // 13pt
        chapter: 36,   // 18pt
        subSection: 26 // 13pt
    },
    spacing: {
        line: 288,     // 1.2 lines (1.2 * 240)
        before: 120,   // 6pt
        after: 0       // 0pt
    },
    margins: {
        top: "2.5cm",
        bottom: "2.5cm",
        left: "3.5cm",
        right: "2cm"
    },
    indent: "1cm"
};

// Đọc nội dung từ report_text.txt
const content = fs.readFileSync("report_text.txt", "utf-8");
const lines = content.split("\n");

const docSections = [];
let currentChildren = [];

// ==========================================
// CÁC HÀM HỖ TRỢ TẠO ĐOẠN VĂN
// ==========================================

function createStandardParagraph(text, options = {}) {
    return new Paragraph({
        children: [
            new TextRun({ 
                text, 
                font: CONFIG.font, 
                size: options.size || CONFIG.size.normal, 
                bold: options.bold || false,
                italics: options.italics || false
            })
        ],
        alignment: options.alignment || AlignmentType.JUSTIFIED,
        spacing: { 
            before: options.before !== undefined ? options.before : CONFIG.spacing.before, 
            after: options.after !== undefined ? options.after : CONFIG.spacing.after, 
            line: CONFIG.spacing.line 
        },
        indent: options.noIndent ? undefined : { firstLine: CONFIG.indent },
    });
}

function createChapterHeading(text) {
    return new Paragraph({
        text: text.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 240, line: CONFIG.spacing.line },
        children: [
            new TextRun({ 
                text: text.toUpperCase(), 
                font: CONFIG.font, 
                size: CONFIG.size.chapter, 
                bold: true 
            })
        ],
    });
}

function createSubHeading(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
        spacing: { before: 240, after: 120, line: CONFIG.spacing.line },
        children: [
            new TextRun({ 
                text, 
                font: CONFIG.font, 
                size: CONFIG.size.subSection, 
                bold: true 
            })
        ],
    });
}

function flushSection(pageNumberFormat = null, startPageNumber = null) {
    if (currentChildren.length === 0) return;

    const section = {
        properties: {
            page: {
                margin: CONFIG.margins,
                pageNumber: startPageNumber ? { start: startPageNumber, formatType: pageNumberFormat } : undefined,
            },
        },
        children: [...currentChildren],
    };

    // Thêm số trang ở giữa, phía dưới (trừ trang bìa)
    if (pageNumberFormat) {
        section.footers = {
            default: new Footer({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                children: [PageNumber.CURRENT],
                                font: CONFIG.font,
                                size: CONFIG.size.normal,
                            }),
                        ],
                    }),
                ],
            }),
        };
    }

    docSections.push(section);
    currentChildren = [];
}

// ==========================================
// XỬ LÝ NỘI DUNG
// ==========================================

let sectionState = "COVERS"; // COVERS -> FRONT_MATTER -> BODY

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line && !line.includes("---")) continue;

    // Chuyển đổi Section
    if (line.includes("-----------------------------------------------------------")) {
        if (sectionState === "COVERS") {
            flushSection(); // Trang bìa không số trang
            sectionState = "FRONT_MATTER";
        } else if (sectionState === "FRONT_MATTER") {
            // Kiểm tra xem trang tiếp theo có phải là MỞ ĐẦU không
            const nextNonEmpty = lines.slice(i+1).find(l => l.trim().length > 0);
            if (nextNonEmpty && (nextNonEmpty.includes("MỞ ĐẦU") || nextNonEmpty.startsWith("CHƯƠNG"))) {
                 flushSection(NumberFormat.LOWER_ROMAN); // Kết thúc front matter (i, ii...)
                 sectionState = "BODY";
            } else {
                currentChildren.push(new Paragraph({ children: [new PageBreak()] }));
            }
        } else {
            currentChildren.push(new Paragraph({ children: [new PageBreak()] }));
        }
        continue;
    }

    // Xử lý tiêu đề đặc biệt
    if (line.startsWith("[TRANG BÌA")) {
        continue; // Bỏ qua nhãn marker
    }

    // Phát hiện chương hoặc phần lớn
    if (line.startsWith("CHƯƠNG") || line === "MỞ ĐẦU" || line === "KẾT LUẬN" || line === "TÀI LIỆU THAM KHẢO" || line === "PHỤ LỤC" || line === "LỜI CẢM ƠN" || line === "MỤC LỤC" || line.startsWith("DANH MỤC")) {
        currentChildren.push(createChapterHeading(line));
        continue;
    }

    // Phát hiện tiểu mục (1.1, 1.1.1, ...)
    if (/^\d+\.\d+(\.\d+)?/.test(line)) {
        currentChildren.push(createSubHeading(line));
        continue;
    }

    // Phát hiện Bảng hoặc Hình
    if (line.startsWith("Bảng") || line.startsWith("Hình")) {
        currentChildren.push(new Paragraph({
            children: [new TextRun({ text: line, font: CONFIG.font, size: CONFIG.size.normal, bold: true, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120, line: CONFIG.spacing.line },
            noIndent: true
        }));
        continue;
    }

    // Xử lý văn bản thường
    // Nếu trong Section COVERS thì căn giữa
    if (sectionState === "COVERS") {
        currentChildren.push(createStandardParagraph(line, { 
            alignment: AlignmentType.CENTER, 
            noIndent: true,
            bold: line === line.toUpperCase() && line.length > 10,
            size: line.includes("ĐỒ ÁN TỐT NGHIỆP") ? 32 : (line.includes("TÊN ĐỀ TÀI") ? 28 : CONFIG.size.normal)
        }));
    } else {
        // Căn lề lùi 1cm cho văn bản thường
        currentChildren.push(createStandardParagraph(line));
    }
}

// Flush đoạn cuối
if (sectionState === "BODY") {
    flushSection(NumberFormat.DECIMAL, 1); // Body dùng số 1, 2, 3...
} else {
    flushSection();
}

// ==========================================
// XUẤT FILE DOCX
// ==========================================
const doc = new Document({
    sections: docSections,
});

Packer.toBuffer(doc).then((buffer) => {
    const outputName = "Bao_cao_EDULearn_Final_v4_Members.docx";
    fs.writeFileSync(outputName, buffer);
    console.log("-----------------------------------------------------------");
    console.log(`Đã tạo thành công file: ${outputName}`);
    console.log("Quy cách áp dụng:");
    console.log("- Font: Times New Roman, 13pt");
    console.log("- Lề: Trái 3.5cm, Phải 2cm, Trên/Dưới 2.5cm");
    console.log("- Dãn dòng: 1.2 lines, Khoảng cách đoạn: 6pt before");
    console.log("- Đánh số trang: Giữa dưới, Bắt đầu từ Mở đầu");
    console.log("-----------------------------------------------------------");
});
