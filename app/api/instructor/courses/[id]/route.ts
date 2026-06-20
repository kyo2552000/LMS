import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getAuthUser } from '@/lib/auth';

async function ensureInstructorOwnsCourse(courseId: string, userId: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id FROM courses WHERE id = ? AND instructor_id = ? LIMIT 1`,
    [courseId, userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

  const { id } = await params;
  const owned = await ensureInstructorOwnsCourse(id, user.id);
  if (!owned) return NextResponse.json({ error: 'Không có quyền với khóa học này' }, { status: 403 });

  try {
    const { data } = await request.json();
    if (!data) return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });

    const filtered = { ...data };
    delete (filtered as any).id;
    delete (filtered as any).instructor_id;

    if (filtered.title && !filtered.slug) {
      filtered.slug = String(filtered.title)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    const setClauses = Object.keys(filtered).map((key) => `\`${key}\` = ?`).join(', ');
    const values = [...Object.values(filtered), id];

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE courses SET ${setClauses} WHERE id = ?`,
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
  const owned = await ensureInstructorOwnsCourse(id, user.id);
  if (!owned) return NextResponse.json({ error: 'Không có quyền với khóa học này' }, { status: 403 });

  try {
    const [result] = await db.execute<ResultSetHeader>(`DELETE FROM courses WHERE id = ?`, [id]);
    return NextResponse.json({ affectedRows: result.affectedRows });
  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    return NextResponse.json({ error: err.sqlMessage || err.message || 'Xóa thất bại' }, { status: 400 });
  }
}
