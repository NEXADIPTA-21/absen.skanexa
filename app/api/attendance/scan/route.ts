import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getStudentByQrToken,
  recordCheckIn,
  recordCheckOut,
  getAttendanceSettings,
  logAudit,
} from '@/lib/db';
import { formatDisplayTime, getTimeWIB, getTodayDateWIB } from '@/lib/time';
import { ScanRequest, ScanResponse } from '@/lib/types';
import { isValidQrTokenFormat } from '@/lib/qr';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Session authorization
    const session = getSession();
    if (!session || (session.role !== 'security' && session.role !== 'admin')) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Sesi scanner tidak valid atau belum login.',
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: ScanRequest = await req.json();
    const token = body?.token?.trim();
    const action = body?.action;

    if (!token || !action || (action !== 'check_in' && action !== 'check_out')) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_QR',
          message: 'Format permintaan scan tidak valid.',
        },
        { status: 400 }
      );
    }

    // Format pre-validation
    if (!isValidQrTokenFormat(token)) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_QR',
          message: 'QR Code tidak dikenali atau format token salah.',
        },
        { status: 200 } // return 200 with code for immediate client UI rendering
      );
    }

    // 3. Fast direct indexed lookup
    const student = await getStudentByQrToken(token);
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_QR',
          message: 'QR Code tidak terdaftar dalam sistem.',
        },
        { status: 200 }
      );
    }

    // 4. Validate Student Status
    if (student.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          code: 'STUDENT_DISABLED',
          message: 'Siswa nonaktif. Hubungi Admin SKANEXA.',
          details: {
            name: student.name,
            class: student.class_name,
          },
        },
        { status: 200 }
      );
    }

    const todayDate = getTodayDateWIB();
    const settings = await getAttendanceSettings();
    const studentClass = student.class_name || '-';

    // 5. Handle CHECK IN
    if (action === 'check_in') {
      const { record, isDuplicate } = await recordCheckIn(
        student.id,
        todayDate,
        session.userId,
        settings.late_threshold
      );

      if (isDuplicate) {
        return NextResponse.json(
          {
            success: false,
            code: 'ALREADY_CHECKED_IN',
            message: 'Siswa ini sudah melakukan Check In hari ini.',
            details: {
              name: student.name,
              class: studentClass,
              time: formatDisplayTime(record.check_in_at),
            },
          },
          { status: 200 }
        );
      }

      // Record audit log asynchronously
      logAudit(session.userId, 'attendance.check_in', 'attendance', record.id, {
        student_id: student.id,
        student_name: student.name,
        time: record.check_in_at,
        status: record.status,
      }).catch((e) => console.error('Audit log error:', e));

      const timeFormatted = getTimeWIB(new Date(record.check_in_at!));

      const responsePayload: ScanResponse = {
        success: true,
        name: student.name,
        class: studentClass,
        action: 'check_in',
        time: `${timeFormatted} WIB`,
        status: record.status,
        message: record.status === 'late' ? 'Check In Terlambat' : 'Check In Berhasil',
      };

      return NextResponse.json(responsePayload, {
        headers: {
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
      });
    }

    // 6. Handle CHECK OUT
    if (action === 'check_out') {
      const { record, notCheckedIn, alreadyCheckedOut } = await recordCheckOut(
        student.id,
        todayDate,
        session.userId
      );

      if (notCheckedIn) {
        return NextResponse.json(
          {
            success: false,
            code: 'NOT_CHECKED_IN',
            message: 'Check Out ditolak! Siswa belum melakukan Check In hari ini.',
            details: {
              name: student.name,
              class: studentClass,
            },
          },
          { status: 200 }
        );
      }

      if (alreadyCheckedOut && record) {
        return NextResponse.json(
          {
            success: false,
            code: 'ALREADY_CHECKED_OUT',
            message: 'Siswa ini sudah melakukan Check Out hari ini.',
            details: {
              name: student.name,
              class: studentClass,
              time: formatDisplayTime(record.check_out_at),
            },
          },
          { status: 200 }
        );
      }

      if (record) {
        logAudit(session.userId, 'attendance.check_out', 'attendance', record.id, {
          student_id: student.id,
          student_name: student.name,
          time: record.check_out_at,
        }).catch((e) => console.error('Audit log error:', e));

        const timeFormatted = getTimeWIB(new Date(record.check_out_at!));

        const responsePayload: ScanResponse = {
          success: true,
          name: student.name,
          class: studentClass,
          action: 'check_out',
          time: `${timeFormatted} WIB`,
          status: 'checked_out',
          message: 'Check Out Berhasil',
        };

        return NextResponse.json(responsePayload, {
          headers: {
            'X-Response-Time': `${Date.now() - startTime}ms`,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        code: 'SERVER_ERROR',
        message: 'Aksi absensi tidak valid.',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Scan API Error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'SERVER_ERROR',
        message: 'Terjadi kesalahan sistem saat memproses scan.',
      },
      { status: 500 }
    );
  }
}
