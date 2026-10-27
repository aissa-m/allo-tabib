import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SESSION_COOKIE, isControlEnabled, readSiteLocked, verifySessionToken } from "@/lib/siteControl";
import { ControlLogin, ControlPanel } from "./ControlPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Control",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SiteControlPage() {
  if (!isControlEnabled()) notFound();
  const authed = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  let locked: boolean | null = null;
  if (authed) {
    try {
      locked = await readSiteLocked();
    } catch (e) {
      console.error("[site-control] readSiteLocked", e);
    }
  }

  return (
    <main dir="ltr" lang="es" className="flex min-h-dvh items-center justify-center px-4 py-12 font-sans">
      {!authed ? (
        <ControlLogin />
      ) : locked === null ? (
        <p className="max-w-sm text-center text-muted">No se pudo leer el estado de la web (error de base de datos). Revisa los logs de Vercel y recarga.</p>
      ) : (
        <ControlPanel locked={locked} />
      )}
    </main>
  );
}
