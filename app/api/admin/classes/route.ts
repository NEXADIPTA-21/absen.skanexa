import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getClasses, createClass, logAudit } from '@/lib/db';

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
