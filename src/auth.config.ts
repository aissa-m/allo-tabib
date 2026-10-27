import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compatible con Edge (sin Prisma ni bcrypt): la usa el middleware.
 * El proveedor Credentials se añade en auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "PROFESSIONAL" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
