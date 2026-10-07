import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getStudents, createStudent, getUserByUsername, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || undefined;
    const search = searchParams.get('search') || undefined;
    const students = await getStudents({ classId, search });

    return NextResponse.json({ success: true, students }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    console.error('GET students error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Gagal mengambil data siswa.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const class_id = typeof body.class_id === 'string' ? body.class_id : '';

    if (!name || !username || !password || !class_id) return NextResponse.json({ success: false, message: 'Semua kolom wajib diisi (Nama, Username, Password, Kelas).' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ success: false, message: 'Password minimal 6 karakter.' }, { status: 400 });

    const existingUser = await getUserByUsername(username);
    if (existingUser) return NextResponse.json({ success: false, message: 'Username sudah digunakan oleh akun lain.' }, { status: 409 });

    const password_hash = await hashPassword(password);
    const newStudent = await createStudent({ name, username, password_hash, class_id });

    await logAudit(session.userId, 'student.created', 'student', newStudent.id, { name: newStudent.name, class_id, username });

    return NextResponse.json({ success: true, message: 'Akun siswa berhasil dibuat.', student: newStudent }, { status: 201 });
  } catch (error: any) {
    console.error('POST students error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Gagal membuat akun siswa.' }, { status: 500 });
  }
}
