/** Une clases condicionales. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Elige el nombre localizado (fr/ar) con caída a francés. */
export function localized(name: { fr: string; ar?: string }, locale: string): string {
  if (locale === "ar" && name.ar) return name.ar;
  return name.fr;
}

export function zoneName(zone: { nameFr: string; nameAr: string }, locale: string): string {
  return locale === "ar" ? zone.nameAr : zone.nameFr;
}

export function specialtyName(s: { nameFr: string; nameAr: string }, locale: string): string {
  return locale === "ar" ? s.nameAr : s.nameFr;
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`;
}

export function initials(p: { firstName: string; lastName: string }): string {
  return `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
}

export function formatDistance(meters: number, locale: string): string {
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-MR" : locale, { maximumFractionDigits: 1 });
  return meters < 1000 ? `${nf.format(Math.round(meters / 10) * 10)} m` : `${nf.format(meters / 1000)} km`;
}

/** Fetcher JSON para SWR que lanza en errores HTTP. */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}
