import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import { loginSchema } from "./lib/validation";
import { normalizePhone } from "./lib/phone";

/** Tras MAX_FAILED_LOGINS fallos seguidos, la cuenta no admite intentos durante LOCK_MS. */
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
/** Hash de relleno: con un usuario inexistente se tarda lo mismo (no se delata qué números existen). */
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

/** Cuenta bloqueada por demasiados intentos: el cliente lo recibe como `code: "locked"`. */
class AccountLocked extends CredentialsSignin {
  code = "locked";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Phone or email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        const user = identifier.includes("@")
          ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
          : await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } });
        if (!user) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) throw new AccountLocked();

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          const failed = user.failedLogins + 1;
          const locked = failed >= MAX_FAILED_LOGINS;
          await prisma.user.update({
            where: { id: user.id },
            data: locked ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: failed },
          });
          if (locked) throw new AccountLocked();
          return null;
        }
        if (user.failedLogins || user.lockedUntil) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
        }

        return { id: user.id, role: user.role, email: user.email };
      },
    }),
  ],
});
