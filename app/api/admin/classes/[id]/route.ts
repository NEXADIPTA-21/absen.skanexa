import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateClass, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const classId = params.id;
  const body = await req.json();
  const { name, status } = body;

  if (!name) {
    return NextResponse.json({ success: false, message: 'Nama kelas wajib diisi' }, { status: 400 });
  }

  const updated = await updateClass(classId, name, status || 'active');
  if (!updated) {
    return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  await logAudit(session.userId, 'class.updated', 'class', classId, { name, status });
  return NextResponse.json({ success: true });
}
