import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAuditLogs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const logs = await getAuditLogs(200);
  return NextResponse.json({ success: true, logs });
}
