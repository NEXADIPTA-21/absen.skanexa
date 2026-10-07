import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDashboardStats, getAttendanceSettings, getStudents, getAttendanceRecords } from '@/lib/db';
import { formatIndonesianDate, getTodayDateWIB } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const todayDate = getTodayDateWIB();
  const stats = await getDashboardStats(todayDate);
  const settings = await getAttendanceSettings();
  const recentAttendance = await getAttendanceRecords({ date: todayDate });

  return NextResponse.json({
    success: true,
    todayDate,
    formattedDate: formatIndonesianDate(todayDate),
    stats,
    settings,
    recentAttendance: recentAttendance.slice(0, 10), // latest 10 check-ins today
  });
}
