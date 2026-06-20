/**
 * Cập nhật Edu-Learn.pptx theo dự án: chỉnh text + thay ảnh PNG bằng sơ đồ generated-diagrams.
 * Giữ nguyên file .svg trong slide (tránh vỡ layout).
 */
import fs from "fs";
import path from "path";
import JSZip from "jszip";

const projectRoot = process.cwd();
const inputName = "Edu-Learn.pptx";
const inputPath = path.join(projectRoot, inputName);
const diagramsDir = path.join(projectRoot, "generated-diagrams");

function png(name) {
  return path.join(diagramsDir, name);
}

/** Chỉnh sửa text trong XML (giữ nguyên entity &amp; nếu đã đúng) */
function patchText(xml) {
  let s = xml;
  const pairs = [
    ["Edu Learn", "EduLearn"],
    ["dự án Edu Learn", "dự án EduLearn"],
    ["Implement permission-based access control", "Phân quyền theo permission (roles + role_permissions)"],
    ["cookie-based session management", "cookie httpOnly (auth_token) + JWT"],
    ["Next.js API Routes", "Next.js Route Handlers (app/api)"],
    ["Integrate payment gateway thực tế (Stripe, VNPay)", "Tích hợp VietQR (hiện tại) và mở rộng VNPay/MoMo"],
    ["Build mobile app với React Native", "Ứng dụng mobile (React Native / PWA) — hướng mở rộng"],
    ["ChatBot AI support", "Chatbot AI (Google Gemini)"],
    ["ChatBot AI", "Chatbot AI (Gemini)"],
    ["LMS (Learning Management System)", "LMS / nền tảng e-learning EduLearn"],
  ];
  for (const [a, b] of pairs) {
    if (s.includes(a)) s = s.split(a).join(b);
  }
  return s;
}

/** Thay nội dung file PNG trong gói — chỉ khi file nguồn tồn tại */
function replacePng(zip, zipPath, diagramFilename) {
  const disk = png(diagramFilename);
  if (!fs.existsSync(disk)) {
    console.warn("Bỏ qua (thiếu file):", diagramFilename);
    return;
  }
  zip.file(zipPath, fs.readFileSync(disk), { binary: true });
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    console.error("Không tìm thấy:", inputPath);
    process.exit(1);
  }

  const buf = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(buf);

  const textLike = (name) =>
    name.endsWith(".xml") ||
    name.endsWith(".rels") ||
    name === "[Content_Types].xml";

  for (const name of Object.keys(zip.files)) {
    const entry = zip.files[name];
    if (entry.dir || !textLike(name)) continue;
    if (name.startsWith("ppt/embed/")) continue;
    const text = await entry.async("string");
    const next = patchText(text);
    if (next !== text) zip.file(name, next);
  }

  if (zip.file("docProps/core.xml")) {
    let core = await zip.file("docProps/core.xml").async("string");
    if (core.includes("<dc:title>")) {
      core = core.replace(
        /<dc:title>[^<]*<\/dc:title>/,
        "<dc:title>EduLearn — Thuyết trình đồ án</dc:title>"
      );
    }
    zip.file("docProps/core.xml", core);
  }

  /** Map ppt/media/*.png → file trong generated-diagrams (bổ trợ nội dung slide) */
  const pngMap = {
    "ppt/media/image3.png": "01-1-1-use-case-tong-quat.png",
    "ppt/media/image4.png": "14-5-1-kien-truc-tong-the-he-thong.png",
    "ppt/media/image5.png": "15-6-1-xu-ly-ang-nhap.png",
    "ppt/media/image7.png": "16-6-2-xu-ly-mua-khoa-hoc.png",
    "ppt/media/image9.png": "08-2-2-hoat-ong-ang-ky.png",
    "ppt/media/image10.png": "09-2-3-hoat-ong-mua-khoa-hoc.png",
    "ppt/media/image11.png": "03-1-3-use-case-chi-tiet-quan-ly-khoa-hoc.png",
    "ppt/media/image12.png": "04-1-4-use-case-chi-tiet-thanh-toan-on-hang.png",
    "ppt/media/image13.png": "05-1-5-use-case-chi-tiet-chatbot-ai.png",
    "ppt/media/image14.png": "06-1-6-use-case-chi-tiet-admin.png",
    "ppt/media/image15.png": "10-2-4-hoat-ong-chatbot-ai.png",
    "ppt/media/image16.png": "16-6-2-xu-ly-mua-khoa-hoc.png",
    "ppt/media/image21.png": "07-2-1-hoat-ong-ang-nhap.png",
    "ppt/media/image22.png": "17-6-3-xu-ly-chatbot-ai.png",
    "ppt/media/image23.png": "09-2-3-hoat-ong-mua-khoa-hoc.png",
    "ppt/media/image24.png": "11-2-5-hoat-ong-admin-quan-ly-du-lieu.png",
    "ppt/media/image25.png": "18-6-4-so-o-lop-thiet-ke.png",
    "ppt/media/image26.png": "11-2-5-hoat-ong-admin-quan-ly-du-lieu.png",
    "ppt/media/image27.png": "13-4-1-erd-tong-quat.png",
    "ppt/media/image29.png": "12-3-1-so-o-lop-phan-tich.png",
    "ppt/media/image30.png": "14-5-1-kien-truc-tong-the-he-thong.png",
  };

  for (const [zPath, diagram] of Object.entries(pngMap)) {
    if (!zip.file(zPath)) {
      console.warn("Không có trong pptx:", zPath);
      continue;
    }
    replacePng(zip, zPath, diagram);
  }

  const outBuf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  try {
    fs.writeFileSync(inputPath, outBuf);
    console.log("Đã cập nhật:", inputPath);
  } catch (e) {
    if (e && e.code === "EBUSY") {
      const alt = path.join(projectRoot, "Edu-Learn-patched.pptx");
      fs.writeFileSync(alt, outBuf);
      console.warn("File đang mở — đã ghi:", alt);
    } else {
      throw e;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
