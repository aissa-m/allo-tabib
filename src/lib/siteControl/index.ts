import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";

/**
 * Panel oculto para bloquear/desbloquear toda la web.
 *
 * - La URL pública del panel es SITE_CONTROL_PATH (secreta, solo en variables de entorno).
 *   El middleware la reescribe a CONTROL_ROUTE, que da 404 si se pide directamente.
 * - La contraseña es SITE_CONTROL_PASSWORD_HASH (generada con `npm run site-control -- hash`).
 *   Es independiente de NextAuth: el panel funciona aunque la web (login incluido) esté bloqueada.
 * - Si falta alguna de las dos variables, el panel no existe.
 */
export const CONTROL_ROUTE = "/site-control";
export const SESSION_COOKIE = "sc_session";
export const SESSION_MAX_AGE = 8 * 60 * 60; // segundos

const MAX_FAILED_LOGINS = 5;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
/** Cada instancia del servidor reutiliza el estado leído durante este tiempo. */
const CACHE_TTL_MS = 5000;

export function getControlPath(): string | null {
  const raw = process.env.SITE_CONTROL_PATH?.trim();
  if (!raw || !process.env.SITE_CONTROL_PASSWORD_HASH || !process.env.AUTH_SECRET) return null;
  const path = `/${raw.replace(/^\/+|\/+$/g, "")}`;
  // Ruta demasiado corta o que choca con la interna: panel desactivado.
  if (path.length < 8 || path.startsWith(CONTROL_ROUTE)) return null;
  return path;
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

/** Comprueba la contraseña; tras MAX_FAILED_LOGINS fallos seguidos, rechaza cualquier intento un rato. */
export async function attemptControlLogin(password: string): Promise<"ok" | "invalid" | "throttled"> {
  const hash = process.env.SITE_CONTROL_PASSWORD_HASH;
  if (!hash) return "invalid";
  const row = await prisma.siteSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  if (row.loginBlockedUntil && row.loginBlockedUntil > new Date()) return "throttled";

  if (await verifyPassword(password, hash)) {
    if (row.failedLogins || row.loginBlockedUntil) {
      await prisma.siteSetting.update({ where: { id: 1 }, data: { failedLogins: 0, loginBlockedUntil: null } });
    }
    return "ok";
  }

  const failed = row.failedLogins + 1;
  const blocked = failed >= MAX_FAILED_LOGINS;
  await prisma.siteSetting.update({
    where: { id: 1 },
    data: blocked ? { failedLogins: 0, loginBlockedUntil: new Date(Date.now() + LOGIN_BLOCK_MS) } : { failedLogins: failed },
  });
  return blocked ? "throttled" : "invalid";
}

// ── Sesión (cookie firmada "<caducidad>.<hmac>") ─────────────────────────────

/** La clave depende también del hash: cambiar la contraseña invalida las sesiones abiertas. */
function sign(payload: string): string {
  return createHmac("sha256", `${process.env.AUTH_SECRET}:${process.env.SITE_CONTROL_PASSWORD_HASH}`)
    .update(`site-control:${payload}`)
    .digest("base64url");
}

export function createSessionToken(): string {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !getControlPath()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const expected = Buffer.from(sign(exp));
  const actual = Buffer.from(sig);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
