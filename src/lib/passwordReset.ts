import "server-only";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { appUrl, passwordResetMail, sendMail } from "./mail";

export const RESET_TTL_MINUTES = 60;
/** Como mucho este número de correos por cuenta y hora (evita usar la web para inundar un buzón). */
const MAX_REQUESTS_PER_HOUR = 3;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Prepara el correo de restablecimiento para `email`. Devuelve la función que lo envía, o null si
 * no hay nada que enviar (email desconocido o demasiadas peticiones). Quien llama responde siempre
 * lo mismo, para no revelar qué emails están registrados.
 */
export async function prepareResetMail(email: string): Promise<(() => Promise<void>) | null> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user?.email) return null;

  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= MAX_REQUESTS_PER_HOUR) return null;

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    // Solo vale el último enlace pedido: los anteriores se caducan (no se borran, cuentan para el límite).
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + RESET_TTL_MINUTES * 60_000) },
    }),
  ]);

  const link = `${appUrl()}/reset-password?token=${token}`;
  const to = user.email;
  return () => sendMail(passwordResetMail(to, link, RESET_TTL_MINUTES));
}

/** Cambia la contraseña si el token es válido. También desbloquea la cuenta si estaba bloqueada por intentos. */
export async function resetPassword(token: string, password: string): Promise<boolean> {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return false;

  const passwordHash = await bcrypt.hash(password, 10);
  // updateMany con usedAt: null: si dos peticiones llegan a la vez, solo una gana.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return false;

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash, failedLogins: 0, lockedUntil: null } }),
    // Los demás enlaces pendientes dejan de valer
    prisma.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { expiresAt: new Date() } }),
  ]);
  return true;
}
