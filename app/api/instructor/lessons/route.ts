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
    const courseId = searchParams.get('course_id');
    if (!courseId) return NextResponse.json({ error: 'Thiếu course_id' }, { status: 400 });

    const [courseRows] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM courses WHERE id = ? AND instructor_id = ? LIMIT 1`,
      [courseId, user.id]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'Không có quyền với khóa học này' }, { status: 403 });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC LIMIT ? OFFSET ?`,
      [courseId, String(limit), String(offset)]
    );

    const [countResult] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM lessons WHERE course_id = ?`,
      [courseId]
    );

    return NextResponse.json({ rows, total: countResult[0]?.total || 0, page, limit });
  } catch (error) {
    console.error('Instructor lessons GET error:', error);
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
    if (!data || !data.course_id) return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });

    const [courseRows] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM courses WHERE id = ? AND instructor_id = ? LIMIT 1`,
      [data.course_id, user.id]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'Không có quyền với khóa học này' }, { status: 403 });
    }

    const id = crypto.randomUUID();
    const insertData: Record<string, any> = { id, ...data };
    const columns = Object.keys(insertData).map(k => `\`${k}\``).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO lessons (${columns}) VALUES (${placeholders})`,
      values as any[]
    );

    return NextResponse.json({ id, affectedRows: result.affectedRows });
  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    return NextResponse.json({ error: err.sqlMessage || err.message || 'Thêm mới thất bại' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  try {
    const { id, data } = await request.json();
    if (!id || !data) return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT l.id FROM lessons l JOIN courses c ON c.id = l.course_id WHERE l.id = ? AND c.instructor_id = ? LIMIT 1`,
      [id, user.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không có quyền với bài giảng này' }, { status: 403 });
    }

    const setClauses = Object.keys(data).map((key) => `\`${key}\` = ?`).join(', ');
    const values = [...Object.values(data), id];

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE lessons SET ${setClauses} WHERE id = ?`,
      values as any[]
    );

    return NextResponse.json({ affectedRows: result.affectedRows });
  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    return NextResponse.json({ error: err.sqlMessage || err.message || 'Cập nhật thất bại' }, { status: 400 });
  }
}
