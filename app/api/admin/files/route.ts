import { NextResponse } from 'next/server';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { getAuthUser } from '@/lib/auth';
import { existsSync } from 'fs';

// Helper to calculate directory size and list files
async function scanDirectory(dirStr: string) {
    const dir = join(process.cwd(), 'public/uploads', dirStr);
    if (!existsSync(dir)) return { files: [], size: 0 };
    
    const items = await readdir(dir);
    const files = [];
    let totalSize = 0;

    for (const item of items) {
        if (item === '.gitkeep') continue;
        const fullPath = join(dir, item);
        const st = await stat(fullPath);
        if (st.isFile()) {
            files.push({
                name: item,
                size: st.size,
                url: `/uploads/${dirStr}/${item}`,
                created_at: st.birthtime,
                type: dirStr
            });
            totalSize += st.size;
        }
    }
    return { files, size: totalSize };
}

export async function GET() {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const videos = await scanDirectory('videos');
        const images = await scanDirectory('images');
        const docs = await scanDirectory('docs');

        return NextResponse.json({
            files: [...videos.files, ...images.files, ...docs.files].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            stats: {
                videoSize: videos.size,
                imageSize: images.size,
                docSize: docs.size,
                totalSize: videos.size + images.size + docs.size
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi tải danh sách file' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { url } = await request.json();
        if (!url || typeof url !== 'string' || !url.startsWith('/uploads/') || url.includes('..')) {
            return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 });
        }
        
        const fullPath = join(process.cwd(), 'public', url);
        if (existsSync(fullPath)) {
            await unlink(fullPath);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi xóa file' }, { status: 500 });
    }
}
