import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
  }

  const file = request.nextUrl.searchParams.get('file');
  if (!file || file.includes('..')) {
    return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
  }

  const absPath = join(process.cwd(), 'public', 'uploads', file);
  if (!existsSync(absPath)) {
    return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 404 });
  }

  const fileStat = await stat(absPath);
  const stream = createReadStream(absPath);
  const headers = new Headers();
  headers.set('Content-Length', String(fileStat.size));
  headers.set('Content-Type', file.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');
  headers.set('Cache-Control', 'private, no-store');

  return new NextResponse(stream as any, { headers });
}
