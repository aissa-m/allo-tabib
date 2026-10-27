import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import { loginSchema } from "./lib/validation";
import { normalizePhone } from "./lib/phone";

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
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, role: user.role, email: user.email };
      },
    }),
  ],
});
