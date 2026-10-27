"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  attemptControlLogin,
  createSessionToken,
  getControlPath,
  setSiteLocked,
  verifySessionToken,
} from "@/lib/siteControl";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const path = getControlPath();
  if (!path) return { error: "Panel desactivado." };
  const password = String(formData.get("password") ?? "");
  let result: Awaited<ReturnType<typeof attemptControlLogin>>;
  try {
    result = password ? await attemptControlLogin(password) : "invalid";
  } catch (e) {
    console.error("[site-control] login", e);
    return { error: "Error del servidor (base de datos). Revisa los logs de Vercel." };
  }

  if (result === "throttled") return { error: "Demasiados intentos. Espera 15 minutos." };
  if (result === "invalid") {
    await new Promise((r) => setTimeout(r, 600)); // frena intentos automatizados
    return { error: "Contraseña incorrecta." };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    path,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
  });
  return {};
}

export async function logoutAction(): Promise<void> {
  const path = getControlPath();
  if (path) (await cookies()).delete({ name: SESSION_COOKIE, path });
}

export async function setLockedAction(locked: boolean): Promise<{ ok: boolean }> {
  if (!verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)) return { ok: false };
  try {
    await setSiteLocked(locked);
    return { ok: true };
  } catch (e) {
    console.error("[site-control] setLocked", e);
    return { ok: false };
  }
}
