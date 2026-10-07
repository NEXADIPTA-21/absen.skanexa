import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { User, UserRole } from './types';

const SESSION_COOKIE_NAME = 'skanexa_session';
const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  name?: string;
  studentId?: string;
}

// In Next.js App Router, encode session token safely into HTTP-only cookie
export function createSessionCookie(payload: SessionPayload): void {
  const cookieStore = cookies();
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function getSession(): SessionPayload | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as SessionPayload;
    if (parsed && parsed.userId && parsed.role) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}
