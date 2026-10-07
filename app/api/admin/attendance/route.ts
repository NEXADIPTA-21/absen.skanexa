import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAttendanceRecords } from '@/lib/db';
import { getTodayDateWIB } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getTodayDateWIB();
  const classId = searchParams.get('classId') || undefined;
  const status = searchParams.get('status') || undefined;

  const records = await getAttendanceRecords({ date, classId, status });
  return NextResponse.json({ success: true, date, records });
}
