import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { correctAttendance } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, check_in_at, check_out_at, status, reason } = body;

  if (!id || !status) {
    return NextResponse.json(
      { success: false, message: 'ID record dan status absensi wajib diisi.' },
      { status: 400 }
    );
  }

  const updated = await correctAttendance(
    id,
    {
      check_in_at: check_in_at || null,
      check_out_at: check_out_at || null,
      status,
    },
    session.userId,
    reason || 'Koreksi manual oleh admin'
  );

  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Record absensi tidak ditemukan.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Data absensi berhasil dikoreksi.',
    record: updated,
  });
}
