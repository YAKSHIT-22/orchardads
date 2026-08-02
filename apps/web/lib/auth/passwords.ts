import 'server-only';
import { createHash, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';

/** Hash / verify account passwords (bcrypt, cost 10). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** 6-digit numeric OTP. Stored as a sha256 hash, never in plaintext. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
