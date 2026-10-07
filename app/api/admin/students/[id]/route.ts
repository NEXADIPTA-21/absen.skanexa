import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateStudent, logAudit, getStudentById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const studentId = params.id;
  const body = await req.json();
  const { name, class_id, status } = body;

  const current = await getStudentById(studentId);
  if (!current) {
    return NextResponse.json({ success: false, message: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  const ok = await updateStudent(studentId, {
    name: name || current.name,
    class_id: class_id !== undefined ? class_id : (current.class_id || ''),
    status: status || current.status,
  });

  if (!ok) {
    return NextResponse.json({ success: false, message: 'Gagal memperbarui siswa' }, { status: 500 });
  }

  await logAudit(session.userId, 'student.updated', 'student', studentId, {
    previous: { name: current.name, class_id: current.class_id, status: current.status },
    updated: { name, class_id, status },
  });

  return NextResponse.json({ success: true });
}
