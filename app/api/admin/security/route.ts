import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getSecurityOfficers, createUser, getUserByUsername, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const officers = await getSecurityOfficers();
    const sanitized = officers.map((o) => ({
      id: o.id, username: o.username, name: o.name || o.username, status: o.status, created_at: o.created_at,
    }));

    return NextResponse.json({ success: true, officers: sanitized }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    console.error('GET security error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Gagal mengambil data petugas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || !username || !password) return NextResponse.json({ success: false, message: 'Nama, username, dan password wajib diisi.' }, { status: 400 });
    if (username.length < 3) return NextResponse.json({ success: false, message: 'Username minimal 3 karakter.' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ success: false, message: 'Password minimal 6 karakter.' }, { status: 400 });

    const existing = await getUserByUsername(username);
    if (existing) return NextResponse.json({ success: false, message: 'Username sudah digunakan.' }, { status: 409 });

    const password_hash = await hashPassword(password);
    const newOfficer = await createUser({ username, password_hash, role: 'security', status: 'active', name });

    await logAudit(session.userId, 'security.created', 'user', newOfficer.id, { username: newOfficer.username, name: newOfficer.name });

    return NextResponse.json({
      success: true,
      message: 'Akun petugas berhasil dibuat.',
      officer: { id: newOfficer.id, username: newOfficer.username, name: newOfficer.name || newOfficer.username, status: newOfficer.status },
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST security error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Gagal membuat akun petugas.' }, { status: 500 });
  }
}
