import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStudents, createStudent, getUserByUsername, deleteStudents, logAudit } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId') || undefined;
  const search = searchParams.get('search') || undefined;

  const students = await getStudents({ classId, search });
  return NextResponse.json({ success: true, students });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, username, password, class_id } = body;

  if (!name || !username || !password || !class_id) {
    return NextResponse.json(
      { success: false, message: 'Semua kolom wajib diisi (Nama, Username, Password, Kelas).' },
      { status: 400 }
    );
  }

  const existingUser = await getUserByUsername(username.trim());
  if (existingUser) {
    return NextResponse.json(
      { success: false, message: 'Username sudah digunakan oleh akun lain.' },
      { status: 400 }
    );
  }

  const password_hash = await hashPassword(password);
  const newStudent = await createStudent({
    name: name.trim(),
    username: username.trim(),
    password_hash,
    class_id,
  });

  await logAudit(session.userId, 'student.created', 'student', newStudent.id, {
    name: newStudent.name,
    class_id,
    username,
  });

  return NextResponse.json({ success: true, student: newStudent });
}


export async function DELETE(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];

    if (ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada siswa yang dipilih.' }, { status: 400 });
    }

    const deletedCount = await deleteStudents(ids);
    await logAudit(session.userId, 'student.bulk_deleted', 'student', null, { ids, deleted_count: deletedCount });

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      message: `${deletedCount} siswa berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('DELETE students error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Gagal menghapus siswa.' }, { status: 500 });
  }
}
