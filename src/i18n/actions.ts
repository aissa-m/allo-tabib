"use server";

import { cookies } from "next/headers";
import { LOCALES, LOCALE_COOKIE, type AppLocale } from "@/lib/constants";

export async function setLocale(locale: AppLocale) {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
