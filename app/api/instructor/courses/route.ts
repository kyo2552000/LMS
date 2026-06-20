import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [user.id, String(limit), String(offset)]
    );

    const [countResult] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM courses WHERE instructor_id = ?`,
      [user.id]
    );

    return NextResponse.json({ rows, total: countResult[0]?.total || 0, page, limit });
  } catch (error) {
    console.error('Instructor courses GET error:', error);
    return NextResponse.json({ error: 'Lấy dữ liệu thất bại' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  try {
    const { data } = await request.json();
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Yêu cầu dữ liệu' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const insertData: Record<string, any> = {
      id,
      instructor_id: user.id,
      published: 0,
      ...data,
    };

    if (!insertData.category_id) {
      const [categories] = await db.execute<RowDataPacket[]>('SELECT id FROM categories LIMIT 1');
      if (categories.length > 0) insertData.category_id = categories[0].id;
      else return NextResponse.json({ error: 'Không tồn tại danh mục. Vui lòng tạo danh mục trước.' }, { status: 400 });
    }

    if (!insertData.slug && insertData.title) {
      insertData.slug = String(insertData.title)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    if (!insertData.rating || insertData.rating === '') insertData.rating = 0;
    if (Number(insertData.rating) > 9.99 || Number(insertData.rating) < 0) insertData.rating = 0;
    if (!insertData.students || insertData.students === '') insertData.students = 0;

    const columns = Object.keys(insertData).map(k => `\`${k}\``).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO courses (${columns}) VALUES (${placeholders})`,
      values as any[]
    );

    return NextResponse.json({ id, affectedRows: result.affectedRows });
  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    return NextResponse.json({ error: err.sqlMessage || err.message || 'Thêm mới thất bại' }, { status: 400 });
  }
}
