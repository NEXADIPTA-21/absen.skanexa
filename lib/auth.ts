
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { UserRole } from './types';

const SESSION_COOKIE_NAME = 'skanexa_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function hashPassword(
  plainPassword: string
): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  if (!hash || !hash.startsWith('$2')) return false;

  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch {
    return false;
  }
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
      'SESSION_SECRET belum dikonfigurasi dengan benar.'
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
  const session: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const encoded = Buffer.from(
    JSON.stringify(session)
  ).toString('base64url');

  const token = `${encoded}.${sign(encoded)}`;

  cookies().set(SESSION_COOKIE_NAME, token, {
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
    const expected = sign(encoded);

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload;

    if (
      typeof session.userId !== 'string' ||
      !session.userId ||
      typeof session.username !== 'string' ||
      !Number.isFinite(session.exp) ||
      session.exp <= Math.floor(Date.now() / 1000) ||
      !['admin', 'security', 'student'].includes(session.role)
    ) {
      return null;
    }

    return session;
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
