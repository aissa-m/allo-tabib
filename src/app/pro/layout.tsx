import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { MANUALS, type AppLocale } from "@/lib/constants";

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  const g = await getTranslations("guide");
  const manual = MANUALS[(await getLocale()) as AppLocale].href;
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="glass mx-auto flex max-w-xl items-center justify-between px-2 py-1.5">
          <Link href="/pro" className="rounded-xl px-1" aria-label={t("appName")}>
            <Logo name={t("appName")} />
          </Link>
          <div className="flex items-center">
            <a
              href={manual}
              target="_blank"
              rel="noopener"
              aria-label={g("link")}
              title={g("link")}
              className="inline-flex h-10 items-center rounded-xl px-3 text-ink/80 transition duration-200 hover:bg-line/5 hover:text-ink"
            >
              <BookOpen size={18} strokeWidth={1.5} aria-hidden />
            </a>
            <LocaleSwitcher compact />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-3 pb-10 pt-4">{children}</main>
    </div>
  );
}
