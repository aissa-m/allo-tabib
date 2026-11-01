"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, Map as MapIcon, PanelLeftClose, PanelLeftOpen, Users, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { MANUALS, type AppLocale } from "@/lib/constants";
import { cn, fetcher } from "@/lib/utils";

const COLLAPSE_KEY = "allotabib.navCollapsed";

/** Punto verde sobre el icono cuando no cabe el número. */
function NavDot() {
  return <span aria-hidden className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-white dark:ring-[#13111F]" />;
}

/** Número de altas por validar; con `srOnly` queda solo para lectores de pantalla. */
function PendingBadge({ count, srOnly }: { count: number; srOnly?: boolean }) {
  const t = useTranslations("review");
  const label = t("pendingCount", { count });
  if (srOnly) return <span className="sr-only">{label}</span>;
  return (
    <span title={label} className="min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-semibold leading-5 text-[#13111F]">
      <span aria-hidden>{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Barra lateral de cristal colapsable (escritorio) / barra inferior (móvil). */
export function AdminNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const manual = MANUALS[useLocale() as AppLocale].href;
  const [collapsed, setCollapsed] = useState(false);
  const { data: pending } = useSWR<{ count: number }>("/api/admin/pending", fetcher, { refreshInterval: 60_000 });

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* sin almacenamiento */
      }
      return !c;
    });
  };

  const pendingCount = pending?.count ?? 0;
  const items: { href: string; icon: LucideIcon; label: string; active: boolean; badge?: number }[] = [
    { href: "/admin", icon: MapIcon, label: t("admin.nav.map"), active: pathname === "/admin" },
    {
      // Con altas pendientes, el enlace abre directamente esa pestaña.
      href: pendingCount ? "/admin/professionals?status=PENDING" : "/admin/professionals",
      icon: Users,
      label: t("admin.nav.professionals"),
      active: pathname.startsWith("/admin/professionals"),
      badge: pendingCount,
    },
  ];

  return (
    <>
      {/* Escritorio */}
      <motion.nav
        aria-label={t("common.menu")}
        animate={{ width: collapsed ? 76 : 232 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="glass relative z-40 m-3 me-0 hidden shrink-0 flex-col overflow-hidden p-3 md:flex"
      >
        <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <Link href="/admin" aria-label={t("common.appName")} className="rounded-xl">
            <Logo name={t("common.appName")} iconOnly={collapsed} />
          </Link>
        </div>
        <ul className="flex-1 space-y-1">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={it.active ? "page" : undefined}
                title={collapsed ? it.label : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition duration-200",
                  collapsed && "justify-center px-0",
                  it.active ? "bg-sage/15 font-medium text-ink" : "text-ink/75 hover:bg-line/5 hover:text-ink",
                )}
              >
                <span className="relative">
                  <it.icon size={20} strokeWidth={1.5} aria-hidden className={it.active ? "text-sage" : undefined} />
                  {collapsed && !!it.badge && <NavDot />}
                </span>
                {!collapsed && <span className="flex-1">{it.label}</span>}
                {collapsed && <span className="sr-only">{it.label}</span>}
                {!!it.badge && <PendingBadge count={it.badge} srOnly={collapsed} />}
              </Link>
            </li>
          ))}
        </ul>
        <a
          href={manual}
          target="_blank"
          rel="noopener"
          title={collapsed ? t("guide.link") : undefined}
          className={cn(
            "mb-1 flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-ink/75 transition duration-200 hover:bg-line/5 hover:text-ink",
            collapsed && "justify-center px-0",
          )}
        >
          <BookOpen size={20} strokeWidth={1.5} aria-hidden />
          {collapsed ? <span className="sr-only">{t("guide.link")}</span> : <span>{t("guide.link")}</span>}
        </a>
        <div className={cn("space-y-1 border-t border-line/[0.06] pt-3", collapsed && "flex flex-col items-center")}>
          <LocaleSwitcher compact={collapsed} placement="side" />
          <ThemeToggle withLabel={!collapsed} />
          <LogoutButton withLabel={!collapsed} />
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? t("common.expand") : t("common.collapse")}
            title={collapsed ? t("common.expand") : t("common.collapse")}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-muted transition hover:bg-line/5 hover:text-ink"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden className="rtl:-scale-x-100" />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden className="rtl:-scale-x-100" />
            )}
            {!collapsed && <span>{t("common.collapse")}</span>}
          </button>
        </div>
      </motion.nav>

      {/* Móvil: barra inferior */}
      <nav
        aria-label={t("common.menu")}
        className="glass-strong fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around rounded-none rounded-t-2xl px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={it.active ? "page" : undefined}
            className={cn("flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px]", it.active ? "text-sage" : "text-ink/70")}
          >
            <span className="relative">
              <it.icon size={22} strokeWidth={1.5} aria-hidden />
              {!!it.badge && <NavDot />}
            </span>
            {it.label}
            {!!it.badge && <PendingBadge count={it.badge} srOnly />}
          </Link>
        ))}
        <a
          href={manual}
          target="_blank"
          rel="noopener"
          aria-label={t("guide.link")}
          className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-ink/70"
        >
          <BookOpen size={22} strokeWidth={1.5} aria-hidden />
        </a>
        <LocaleSwitcher compact placement="top" />
        <ThemeToggle />
        <LogoutButton />
      </nav>
    </>
  );
}
