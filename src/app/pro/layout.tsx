import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/ui/LogoutButton";

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="glass mx-auto flex max-w-xl items-center justify-between px-2 py-1.5">
          <Link href="/pro" className="rounded-xl px-1" aria-label={t("appName")}>
            <Logo name={t("appName")} />
          </Link>
          <div className="flex items-center">
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
