import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, type AppLocale } from "@/lib/constants";

function isLocale(v: string | undefined): v is AppLocale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

/** Idioma por cookie (sin prefijo en la URL); si no hay cookie, francés por defecto. */
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  let locale: AppLocale = DEFAULT_LOCALE;
  if (isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const accept = (await headers()).get("accept-language")?.slice(0, 2);
    // El francés es el idioma por defecto; el árabe se respeta si es el preferido del navegador.
    if (accept === "ar") locale = "ar";
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Africa/Nouakchott",
  };
});
