import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { createStudent, getClasses, getUserByUsername, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_ROWS = 200;

type ImportRow = {
  name?: unknown;
  username?: unknown;
  password?: unknown;
  class?: unknown;
  class_name?: unknown;
};

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows as ImportRow[] : [];
    const defaultPassword = typeof body?.default_password === 'string' ? body.default_password : 'student123';

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'File tidak berisi data siswa.' }, { status: 400 });
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ success: false, message: `Maksimal ${MAX_ROWS} siswa per upload.` }, { status: 400 });
    }

    if (defaultPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Password default minimal 6 karakter.' }, { status: 400 });
    }

    const classes = await getClasses();
    const classMap = new Map(classes.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const seenUsernames = new Set<string>();
    const prepared: Array<{ rowNumber: number; name: string; username: string; password: string; class_id: string }> = [];
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      const name = String(row.name ?? '').trim();
      const username = String(row.username ?? '').trim().toLowerCase();
      const password = String(row.password ?? '').trim() || defaultPassword;
      const className = String(row.class_name ?? row.class ?? '').trim();

      if (!name || !username || !className) {
        errors.push({ row: rowNumber, message: 'Nama, username, dan kelas wajib diisi.' });
        continue;
      }
      if (password.length < 6) {
        errors.push({ row: rowNumber, message: 'Password minimal 6 karakter.' });
        continue;
      }
      if (seenUsernames.has(username)) {
        errors.push({ row: rowNumber, message: `Username ${username} duplikat di file.` });
        continue;
      }
      seenUsernames.add(username);

      const classId = classMap.get(className.toLowerCase());
      if (!classId) {
        errors.push({ row: rowNumber, message: `Kelas "${className}" tidak ditemukan.` });
        continue;
      }

      const existing = await getUserByUsername(username);
      if (existing) {
        errors.push({ row: rowNumber, message: `Username "${username}" sudah digunakan.` });
        continue;
      }

      prepared.push({ rowNumber, name, username, password, class_id: classId });
    }

    let successCount = 0;
    for (const item of prepared) {
      try {
        const password_hash = await hashPassword(item.password);
        const student = await createStudent({
          name: item.name,
          username: item.username,
          password_hash,
          class_id: item.class_id,
        });
        successCount++;
        await logAudit(session.userId, 'student.created_bulk', 'student', student.id, {
          name: item.name,
          username: item.username,
          class_id: item.class_id,
          row: item.rowNumber,
        });
      } catch (error: any) {
        errors.push({ row: item.rowNumber, message: error?.message || 'Gagal membuat siswa.' });
      }
    }

    await logAudit(session.userId, 'student.bulk_import', 'student', null, {
      total_rows: rows.length,
      success_count: successCount,
      error_count: errors.length,
    });

    return NextResponse.json({
      success: successCount > 0,
      message: successCount > 0
        ? `${successCount} siswa berhasil diimport${errors.length ? `, ${errors.length} baris gagal.` : '.'}`
        : 'Tidak ada siswa yang berhasil diimport.',
      imported_count: successCount,
      error_count: errors.length,
      errors,
    });
  } catch (error: any) {
    console.error('Bulk student import error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Gagal mengimport data siswa.' }, { status: 500 });
  }
}
