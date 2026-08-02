import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function key(): Buffer {
  const k = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY ?? '', 'base64');
  if (k.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (base64).');
  return k;
}

/** Envelope-encrypt a token for storage. Returns plain Uint8Arrays for Prisma Bytes. */
export function encryptToken(plain: string): {
  cipher: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  tag: Uint8Array<ArrayBuffer>;
} {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const cipher = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return { cipher: toBytes(cipher), iv: toBytes(iv), tag: toBytes(c.getAuthTag()) };
}

/** Copy into a Uint8Array backed by a plain ArrayBuffer (what Prisma Bytes wants). */
function toBytes(b: Buffer): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(b.byteLength));
  out.set(b);
  return out;
}

/**
 * Envelope-decrypt a stored token (AES-256-GCM). Tokens never reach the browser
 * (ARCHITECTURE.md sec 10). TOKEN_ENCRYPTION_KEY is 32-byte base64.
 */
export function decryptToken(cipher: Uint8Array, iv: Uint8Array, tag: Uint8Array): string {
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv));
  decipher.setAuthTag(Buffer.from(tag));
  return Buffer.concat([decipher.update(Buffer.from(cipher)), decipher.final()]).toString('utf8');
}
