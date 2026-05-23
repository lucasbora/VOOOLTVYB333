import crypto from 'crypto';

/**
 * Base32 decode helper for TOTP secrets (RFC 4648 alphabet)
 */
function decodeBase32(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean    = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');

  let bits  = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid base32 character: ${ch}`);
    value = (value << 5) | idx;
    bits  += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Computes a standard HOTP value (RFC 4226) for a given counter.
 */
function generateHOTP(secretBase32: string, counter: number): string {
  const key = decodeBase32(secretBase32);

  // 8-byte big-endian counter
  const buf = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c >>= 8;
  }

  const hmac   = crypto.createHmac('sha1', key);
  hmac.update(buf);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const code   =
    ((digest[offset]     & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) <<  8) |
    ( digest[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, '0');
}

/**
 * Generates a random Base32 secret (20 bytes / 160 bits).
 */
export function generateSecret(): string {
  const alphabet    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.randomBytes(20);
  return Array.from(randomBytes, (b) => alphabet[b % 32]).join('');
}

/**
 * Verifies a 6-digit TOTP code against a Base32 secret, allowing ±1 window
 * (±30 seconds of clock drift).
 */
export function verifyTOTP(code: string, secretBase32: string, windowSize = 1): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -windowSize; i <= windowSize; i++) {
    if (generateHOTP(secretBase32, counter + i) === code) return true;
  }
  return false;
}
