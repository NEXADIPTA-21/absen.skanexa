import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, getStudentByUserId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user || user.status !== 'active') {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  let studentData = null;
  if (user.role === 'student') {
    studentData = await getStudentByUserId(user.id);
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name || user.username,
      student: studentData,
    },
  });
}
