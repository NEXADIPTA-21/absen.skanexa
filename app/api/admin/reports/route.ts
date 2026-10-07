import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAttendanceRecords } from '@/lib/db';
import { formatDisplayTime, getTodayDateWIB } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') || getTodayDateWIB();
  const endDate = searchParams.get('endDate') || getTodayDateWIB();
  const classId = searchParams.get('classId') || undefined;
  const status = searchParams.get('status') || undefined;
  const format = searchParams.get('format') || 'json';

  const records = await getAttendanceRecords({ startDate, endDate, classId, status });

  if (format === 'csv') {
    // Generate CSV string
    const headers = ['Tanggal', 'Nama Siswa', 'Kelas', 'Jam Masuk', 'Jam Pulang', 'Status', 'Petugas Masuk', 'Petugas Pulang'];
    const rows = records.map((r) => {
      let statusLabel = 'Hadir';
      if (r.status === 'late') statusLabel = 'Terlambat';
      if (r.status === 'checked_out') statusLabel = 'Checked Out';
      if (r.status === 'absent') statusLabel = 'Tidak Hadir';

      return [
        `"${r.attendance_date}"`,
        `"${(r.student_name || '').replace(/"/g, '""')}"`,
        `"${(r.class_name || '').replace(/"/g, '""')}"`,
        `"${formatDisplayTime(r.check_in_at)}"`,
        `"${formatDisplayTime(r.check_out_at)}"`,
        `"${statusLabel}"`,
        `"${(r.check_in_by_name || '').replace(/"/g, '""')}"`,
        `"${(r.check_out_by_name || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const filename = `laporan-absen-skanexa-${startDate}-sd-${endDate}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({ success: true, count: records.length, records });
}
