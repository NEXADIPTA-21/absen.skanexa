import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAttendanceSettings, updateAttendanceSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getAttendanceSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { check_in_start, late_threshold, check_in_end, check_out_start, check_out_end } = body;

  const updated = await updateAttendanceSettings(
    {
      check_in_start,
      late_threshold,
      check_in_end,
      check_out_start,
      check_out_end,
    },
    session.userId
  );

  return NextResponse.json({
    success: true,
    message: 'Pengaturan jam absensi berhasil disimpan.',
    settings: updated,
  });
}
