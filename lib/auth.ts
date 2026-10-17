import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { UserRole } from './types';

const SESSION_COOKIE_NAME = 'skanexa_session';
const SALT_ROUNDS = 10;
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  name?: string;
  studentId?: string;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET wajib diatur dan minimal 32 karakter.'
    );
  }

  return secret;
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret())
    .update(value)
    .digest('base64url');
}

export function createSessionCookie(
  payload: Omit<SessionPayload, 'exp'>
): void {
  const cookieStore = cookies();

  const session: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const encoded = Buffer.from(JSON.stringify(session))
    .toString('base64url');

  const token = `${encoded}.${sign(encoded)}`;

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function getSession(): SessionPayload | null {
  try {
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    const expectedSignature = sign(encoded);

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const decoded = Buffer.from(encoded, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as SessionPayload;

    if (
      !parsed.userId ||
      !parsed.username ||
      !parsed.role ||
      !Number.isFinite(parsed.exp) ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const allowedRoles = ['admin', 'security', 'student'];

    if (!allowedRoles.includes(parsed.role)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
```
