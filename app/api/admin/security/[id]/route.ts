import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getUserById, updateUserPassword, updateUserStatus, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const officerId = params.id;
  const body = await req.json();
  const { status, new_password } = body;

  const current = await getUserById(officerId);
  if (!current || current.role !== 'security') {
    return NextResponse.json({ success: false, message: 'Petugas keamanan tidak ditemukan.' }, { status: 404 });
  }

  if (status) {
    await updateUserStatus(officerId, status);
    await logAudit(session.userId, 'security.status_updated', 'user', officerId, { status });
  }

  if (new_password) {
    const hash = await hashPassword(new_password);
    await updateUserPassword(officerId, hash);
    await logAudit(session.userId, 'security.password_reset', 'user', officerId);
  }

  return NextResponse.json({ success: true, message: 'Data petugas berhasil diperbarui.' });
}
