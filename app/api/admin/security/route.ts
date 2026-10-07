import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getSecurityOfficers, createUser, getUserByUsername, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const officers = await getSecurityOfficers();
  const sanitized = officers.map((o) => ({
    id: o.id,
    username: o.username,
    name: o.name || o.username,
    status: o.status,
    created_at: o.created_at,
  }));

  return NextResponse.json({ success: true, officers: sanitized });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, username, password } = body;

  if (!name || !username || !password) {
    return NextResponse.json(
      { success: false, message: 'Nama, username, dan password wajib diisi.' },
      { status: 400 }
    );
  }

  const existing = await getUserByUsername(username.trim());
  if (existing) {
    return NextResponse.json(
      { success: false, message: 'Username sudah digunakan.' },
      { status: 400 }
    );
  }

  const password_hash = await hashPassword(password);
  const newOfficer = await createUser({
    username: username.trim().toLowerCase(),
    password_hash,
    role: 'security',
    status: 'active',
    name: name.trim(),
  });

  await logAudit(session.userId, 'security.created', 'user', newOfficer.id, {
    username: newOfficer.username,
    name: newOfficer.name,
  });

  return NextResponse.json({
    success: true,
    officer: {
      id: newOfficer.id,
      username: newOfficer.username,
      name: newOfficer.name,
      status: newOfficer.status,
    },
  });
}
