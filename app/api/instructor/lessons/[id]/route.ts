import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getAuthUser } from '@/lib/auth';

async function ensureInstructorOwnsLesson(lessonId: string, userId: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT l.id, l.course_id FROM lessons l JOIN courses c ON c.id = l.course_id WHERE l.id = ? AND c.instructor_id = ? LIMIT 1`,
    [lessonId, userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

  const { id } = await params;
  const owned = await ensureInstructorOwnsLesson(id, user.id);
  if (!owned) return NextResponse.json({ error: 'Không có quyền với bài giảng này' }, { status: 403 });

  try {
    const { data } = await request.json();
    if (!data) return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });

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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

  const { id } = await params;
  const owned = await ensureInstructorOwnsLesson(id, user.id);
  if (!owned) return NextResponse.json({ error: 'Không có quyền với bài giảng này' }, { status: 403 });

  try {
    const [result] = await db.execute<ResultSetHeader>(`DELETE FROM lessons WHERE id = ?`, [id]);
    return NextResponse.json({ affectedRows: result.affectedRows });
  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    return NextResponse.json({ error: err.sqlMessage || err.message || 'Xóa thất bại' }, { status: 400 });
  }
}
