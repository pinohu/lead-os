import { createHmac, randomBytes } from "node:crypto";

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // allow 1 step before/after

function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let result = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of encoded.toUpperCase()) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function generateHotp(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(counter);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code = ((hmac[offset]! & 0x7f) << 24 | (hmac[offset + 1]! & 0xff) << 16 | (hmac[offset + 2]! & 0xff) << 8 | (hmac[offset + 3]! & 0xff)) % (10 ** TOTP_DIGITS);
  return code.toString().padStart(TOTP_DIGITS, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function generateTotpUri(secret: string, email: string, issuer = "LeadOS"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

export function validateTotpCode(secret: string, code: string): boolean {
  const secretBuf = base32Decode(secret);
  const now = BigInt(Math.floor(Date.now() / 1000));
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const counter = (now / BigInt(TOTP_PERIOD)) + BigInt(i);
    if (generateHotp(secretBuf, counter) === code) return true;
  }
  return false;
}

export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () => randomBytes(4).toString("hex").toUpperCase());
}

export function getCurrentTotpCode(secret: string): string {
  const secretBuf = base32Decode(secret);
  const counter = BigInt(Math.floor(Date.now() / 1000)) / BigInt(TOTP_PERIOD);
  return generateHotp(secretBuf, counter);
}
