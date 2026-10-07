import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getClasses, createClass, deleteClasses, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const classes = await getClasses();
  return NextResponse.json({ success: true, classes });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = body?.name?.trim();
  if (!name) {
    return NextResponse.json({ success: false, message: 'Nama kelas wajib diisi' }, { status: 400 });
  }

  const newClass = await createClass(name);
  await logAudit(session.userId, 'class.created', 'class', newClass.id, { name });

  return NextResponse.json({ success: true, class: newClass });
}


export async function DELETE(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];

    if (ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada kelas yang dipilih.' }, { status: 400 });
    }

    const deletedCount = await deleteClasses(ids);
    await logAudit(session.userId, 'class.bulk_deleted', 'class', null, { ids, deleted_count: deletedCount });

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      message: `${deletedCount} kelas berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('DELETE classes error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Gagal menghapus kelas.' }, { status: 500 });
  }
}
