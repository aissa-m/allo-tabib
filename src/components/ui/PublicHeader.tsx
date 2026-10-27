import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export async function PublicHeader() {
  const t = await getTranslations("common");
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" aria-label={t("appName")} className="rounded-xl">
        <Logo name={t("appName")} />
      </Link>
      <div className="glass flex items-center gap-0.5 p-1">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
