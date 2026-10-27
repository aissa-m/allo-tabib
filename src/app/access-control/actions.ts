"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  CONTROL_PATH,
  checkControlPassword,
  createSessionToken,
  isControlEnabled,
  setSiteLocked,
  verifySessionToken,
} from "@/lib/siteControl";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isControlEnabled()) return { error: "Panel desactivado." };
  if (!checkControlPassword(String(formData.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Contraseña incorrecta." };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    path: CONTROL_PATH,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
  });
  return {};
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: CONTROL_PATH });
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
