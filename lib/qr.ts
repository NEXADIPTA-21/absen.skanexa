import crypto from 'crypto';

const PREFIX = 'SKNX-ATT-';
const TOKEN_LENGTH = 16;
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a cryptographically secure QR token for a student.
 * Format: SKNX-ATT-XXXXXXXXXXXXXXXX (16 random alphanumeric chars)
 * Non-sequential, unpredictable, free of sensitive information.
 */
export function generateQrToken(): string {
  const randomBytes = crypto.randomBytes(TOKEN_LENGTH);
  let randomString = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    const randomIndex = randomBytes[i] % CHARACTERS.length;
    randomString += CHARACTERS[randomIndex];
  }
  return `${PREFIX}${randomString}`;
}

/**
 * Validates whether a given token string matches the SKNX-ATT format.
 */
export function isValidQrTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const regex = /^SKNX-ATT-[A-Z0-9]{16}$/;
  return regex.test(token.trim());
}
