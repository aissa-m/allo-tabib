import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LEN = 32;

/**
 * Hash de la contraseña del panel oculto: "scrypt:<sal hex>:<hash hex>".
 * Sin "$" (a diferencia de bcrypt) para poder pegarlo tal cual en .env o en Vercel.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LEN);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Formato exacto que genera hashPassword. Un hash cortado al copiarlo no vale (un hash vacío aceptaría cualquier contraseña). */
const HASH_FORMAT = /^scrypt:[0-9a-f]{32}:[0-9a-f]{64}$/;

export function isValidHash(stored: string | undefined): boolean {
  return !!stored && HASH_FORMAT.test(stored.trim());
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isValidHash(stored)) return false;
  const [, saltHex, hashHex] = stored.trim().split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
