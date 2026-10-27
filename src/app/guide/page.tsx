import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Download, ExternalLink, ShieldCheck, Stethoscope } from "lucide-react";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { buttonSizes, buttonVariants } from "@/components/ui/Button";
import { CONTACT_PHONE, LOCALES, MANUALS, type AppLocale } from "@/lib/constants";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guide");
  return { title: t("title") };
}

/** Manuales de uso (FR y AR) para administradores y sanitarios. El del idioma activo va primero. */
export default async function GuidePage() {
  const t = await getTranslations("guide");
  const locale = (await getLocale()) as AppLocale;
  const ordered = [locale, ...LOCALES.filter((l) => l !== locale)];

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6 sm:px-6">
        <div className="max-w-2xl">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-sage">
            <BookOpen size={24} strokeWidth={1.5} aria-hidden />
          </span>
          <h1 className="text-3xl sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-muted">{t("subtitle")}</p>
          <ul className="mt-5 space-y-2 text-[15px]">
            <li className="flex items-center gap-2">
              <ShieldCheck size={18} strokeWidth={1.5} className="shrink-0 text-sage" aria-hidden />
              {t("forAdmins")}
            </li>
            <li className="flex items-center gap-2">
              <Stethoscope size={18} strokeWidth={1.5} className="shrink-0 text-sage" aria-hidden />
              {t("forPros")}
            </li>
          </ul>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {ordered.map((l) => {
            const m = MANUALS[l];
            return (
              <li key={l}>
                <GlassCard strong className="flex h-full flex-col p-6">
                  <p lang={l} dir={l === "ar" ? "rtl" : "ltr"} className="text-2xl font-semibold">
                    {t(l)}
                  </p>
                  <p className="mt-1 text-sm text-muted" dir="ltr">
                    {t("meta", { pages: m.pages, size: m.size })}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <a href={m.href} target="_blank" rel="noopener" className={cn("inline-flex items-center", buttonVariants.primary, buttonSizes.md)}>
                      <ExternalLink size={18} strokeWidth={1.5} aria-hidden />
                      {t("view")}
                    </a>
                    <a href={m.href} download={m.file} className={cn("inline-flex items-center", buttonVariants.secondary, buttonSizes.md)}>
                      <Download size={18} strokeWidth={1.5} aria-hidden />
                      {t("download")}
                    </a>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-muted">
          {t("help")}{" "}
          <a href={`tel:${CONTACT_PHONE}`} dir="ltr" className="font-medium text-ink hover:underline">
            {formatPhone(CONTACT_PHONE)}
          </a>
        </p>
      </main>
    </div>
  );
}
