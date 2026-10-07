import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getStudentById, updateUserPassword, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const studentId = params.id;
  const body = await req.json();
  const newPassword = body?.new_password?.trim();

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json(
      { success: false, message: 'Password baru minimal 4 karakter.' },
      { status: 400 }
    );
  }

  const current = await getStudentById(studentId);
  if (!current) {
    return NextResponse.json({ success: false, message: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  const hash = await hashPassword(newPassword);
  await updateUserPassword(current.user_id, hash);

  await logAudit(session.userId, 'student.password_reset', 'user', current.user_id, {
    student_name: current.name,
    student_id: studentId,
  });

  return NextResponse.json({ success: true, message: 'Password siswa berhasil direset.' });
}
