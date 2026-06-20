import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { join } from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('url');

        if (!fileUrl) {
            return NextResponse.json({ success: false, error: "Missing file URL" }, { status: 400 });
        }

        // Chỉ cho phép file từ uploads/docs
        if (!fileUrl.startsWith('/uploads/docs/') && !fileUrl.startsWith('/uploads/')) {
            return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 });
        }

        const filePath = join(process.cwd(), 'public', fileUrl);
        
        if (!existsSync(filePath)) {
            return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
        }

        // Check it's a docx file
        const isDocx = fileUrl.toLowerCase().endsWith('.docx') || fileUrl.toLowerCase().endsWith('.doc');
        if (!isDocx) {
            return NextResponse.json({ success: false, error: "Only .docx files are supported" }, { status: 400 });
        }

        const buffer = await readFile(filePath);
        const result = await mammoth.convertToHtml({ buffer });

        return NextResponse.json({ 
            success: true, 
            html: result.value,
            messages: result.messages 
        });
    } catch (error) {
        console.error("Parse docx error:", error);
        return NextResponse.json({ success: false, error: "Failed to parse document" }, { status: 500 });
    }
}
