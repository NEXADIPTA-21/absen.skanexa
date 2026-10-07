import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginPage from './login/page';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  const session = getSession();
  if (session) {
    if (session.role === 'admin') redirect('/admin');
    if (session.role === 'security') redirect('/security');
    if (session.role === 'student') redirect('/student');
  }

  return <LoginPage />;
}
