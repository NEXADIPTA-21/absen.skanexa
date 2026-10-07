import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { regenerateStudentQr, getStudentById, logAudit } from '@/lib/db';

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
  const current = await getStudentById(studentId);
  if (!current) {
    return NextResponse.json({ success: false, message: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  const oldToken = current.qr_token;
  const newToken = await regenerateStudentQr(studentId);

  await logAudit(session.userId, 'student.qr_regenerated', 'student', studentId, {
    student_name: current.name,
    old_token: oldToken,
    new_token: newToken,
  });

  return NextResponse.json({
    success: true,
    new_qr_token: newToken,
    message: 'QR Code baru berhasil dibuat. QR lama sudah dinonaktifkan.',
  });
}
