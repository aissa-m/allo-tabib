import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SESSION_COOKIE, getControlPath, readSiteLocked, verifySessionToken } from "@/lib/siteControl";
import { ControlLogin, ControlPanel } from "./ControlPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Control",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Solo se llega aquí a través de SITE_CONTROL_PATH (el middleware da 404 a la ruta directa). */
export default async function SiteControlPage() {
  if (!getControlPath()) notFound();
  const authed = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);

  return (
    <main dir="ltr" lang="es" className="flex min-h-dvh items-center justify-center px-4 py-12 font-sans">
      {authed ? <ControlPanel locked={await readSiteLocked()} /> : <ControlLogin />}
    </main>
  );
}
