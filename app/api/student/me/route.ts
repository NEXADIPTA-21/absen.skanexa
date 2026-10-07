import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStudentByUserId, getTodayAttendance } from '@/lib/db';
import { formatDisplayTime, getTodayDateWIB, formatIndonesianDate } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const student = await getStudentByUserId(session.userId);
  if (!student) {
    return NextResponse.json({ success: false, message: 'Data siswa tidak ditemukan.' }, { status: 404 });
  }

  const todayDate = getTodayDateWIB();
  const attendance = await getTodayAttendance(student.id, todayDate);

  return NextResponse.json({
    success: true,
    todayDate,
    formattedDate: formatIndonesianDate(todayDate),
    student: {
      id: student.id,
      name: student.name,
      username: student.username,
      class_name: student.class_name,
      qr_token: student.qr_token,
      status: student.status,
    },
    attendance: {
      status: attendance?.status || 'absent',
      check_in_at: attendance?.check_in_at || null,
      check_out_at: attendance?.check_out_at || null,
      check_in_formatted: formatDisplayTime(attendance?.check_in_at || null),
      check_out_formatted: formatDisplayTime(attendance?.check_out_at || null),
    },
  });
}
