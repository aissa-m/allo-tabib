import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export async function PublicHeader() {
  const t = await getTranslations();
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" aria-label={t("common.appName")} className="rounded-xl">
        <Logo name={t("common.appName")} />
      </Link>
      <div className="glass flex items-center gap-0.5 p-1">
        <Link
          href="/guide"
          aria-label={t("guide.link")}
          title={t("guide.link")}
          className="inline-flex h-10 items-center rounded-xl px-3 text-ink/80 transition duration-200 hover:bg-line/5 hover:text-ink"
        >
          <BookOpen size={18} strokeWidth={1.5} aria-hidden />
        </Link>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
