import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "./auth.config";
import { CONTROL_ROUTE, getControlPath, isSiteLocked } from "./lib/siteControl";
import { LOCKED_HTML } from "./lib/siteControl/lockedPage";

const { auth } = NextAuth(authConfig);

const ROLE_PATHS = ["/admin", "/pro", "/login", "/register"];

/** Respuesta de 404 normal de la app (la ruta interna del panel no debe delatarse). */
function notFound(req: NextRequest) {
  return NextResponse.rewrite(new URL("/__not-found", req.nextUrl));
}

/** Web bloqueada: 503 sin caché. Las API responden JSON; el resto, la pantalla de aviso. */
function lockedResponse(pathname: string) {
  const headers = { "Cache-Control": "no-store", "Retry-After": "3600", "X-Robots-Tag": "noindex" };
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "SITE_LOCKED" }, { status: 503, headers });
  return new NextResponse(LOCKED_HTML, { status: 503, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}

/**
 * 1. Panel oculto (SITE_CONTROL_PATH): siempre accesible, se reescribe a la ruta interna.
 * 2. Web bloqueada: todo lo demás (páginas, API, login, admin, ficheros) devuelve 503.
 * 3. /pro/* solo PROFESSIONAL, /admin/* solo ADMIN. Las API comprueban el rol por su cuenta.
 */
export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const controlPath = getControlPath();
  if (controlPath && pathname === controlPath) return NextResponse.rewrite(new URL(CONTROL_ROUTE, req.nextUrl));
  if (await isSiteLocked()) return lockedResponse(pathname);
  if (pathname === CONTROL_ROUTE || pathname.startsWith(`${CONTROL_ROUTE}/`)) return notFound(req);
  if (!ROLE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  const role = req.auth?.user?.role;
  const needs = pathname.startsWith("/admin") ? "ADMIN" : pathname.startsWith("/pro") ? "PROFESSIONAL" : null;
  if (!needs) {
    // Usuario autenticado que entra en login/registro: a su panel.
    if (role && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/pro", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!role) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (role !== needs) {
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/pro", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  // Runtime Node: el middleware lee el estado de bloqueo con Prisma.
  runtime: "nodejs",
  // Todo salvo los assets compilados de Next (los necesita el panel oculto para cargarse).
  matcher: ["/((?!_next/static|_next/webpack-hmr|__nextjs).*)"],
};
