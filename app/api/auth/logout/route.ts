import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = getSession();
  if (session) {
    logAudit(session.userId, 'auth.logout', 'user', session.userId).catch(() => {});
  }
  clearSessionCookie();
  return NextResponse.json({ success: true, message: 'Berhasil logout' });
}
