import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Panel oculto para bloquear/desbloquear toda la web.
 *
 * - Ruta fija CONTROL_PATH, siempre accesible aunque la web esté bloqueada.
 * - Contraseña en claro en SITE_CONTROL_PASSWORD. Independiente de NextAuth.
 * - Si falta la contraseña, el panel da 404.
 */
export const CONTROL_PATH = "/access-control";
export const SESSION_COOKIE = "sc_session";
export const SESSION_MAX_AGE = 8 * 60 * 60; // segundos

/** Cada instancia del servidor reutiliza el estado leído durante este tiempo. */
const CACHE_TTL_MS = 5000;

export function isControlEnabled(): boolean {
  return !!controlPassword() && !!process.env.AUTH_SECRET;
}

function controlPassword(): string | undefined {
  return process.env.SITE_CONTROL_PASSWORD?.trim() || undefined;
}

// ── Estado de bloqueo ────────────────────────────────────────────────────────

let cache: { locked: boolean; at: number } | null = null;

/** Lectura con caché para el middleware. Si la BD falla, se usa el último valor conocido (o desbloqueado). */
export async function isSiteLocked(): Promise<boolean> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.locked;
  try {
    return await readSiteLocked();
  } catch {
    return cache?.locked ?? false;
  }
}

/** Lectura directa de la BD (el panel siempre muestra el valor real). */
export async function readSiteLocked(): Promise<boolean> {
  const row = await prisma.siteSetting.findUnique({ where: { id: 1 }, select: { locked: true } });
  const locked = row?.locked ?? false;
  cache = { locked, at: Date.now() };
  return locked;
}

export async function setSiteLocked(locked: boolean): Promise<void> {
  await prisma.siteSetting.upsert({ where: { id: 1 }, update: { locked }, create: { id: 1, locked } });
  cache = { locked, at: Date.now() };
}

// ── Login del panel ──────────────────────────────────────────────────────────

export function checkControlPassword(password: string): boolean {
  const expected = controlPassword();
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── Sesión (cookie firmada "<caducidad>.<hmac>") ─────────────────────────────

/** La clave depende también de la contraseña: cambiarla invalida las sesiones abiertas. */
function sign(payload: string): string {
  return createHmac("sha256", `${process.env.AUTH_SECRET}:${controlPassword()}`)
    .update(`site-control:${payload}`)
    .digest("base64url");
}

export function createSessionToken(): string {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !isControlEnabled()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const expected = Buffer.from(sign(exp));
  const actual = Buffer.from(sig);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
