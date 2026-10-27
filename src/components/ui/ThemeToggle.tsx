"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme, type ThemePref } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const order: ThemePref[] = ["system", "light", "dark"];

/** Interruptor manual de tema: sistema → claro → oscuro. */
export function ThemeToggle({ withLabel, className }: { withLabel?: boolean; className?: string }) {
  const t = useTranslations("common");
  const { pref, setPref } = useTheme();
  const Icon = pref === "dark" ? Moon : pref === "light" ? Sun : Monitor;
  const label = pref === "dark" ? t("themeDark") : pref === "light" ? t("themeLight") : t("themeSystem");
  return (
    <button
      type="button"
      aria-label={`${t("theme")}: ${label}`}
      title={label}
      onClick={() => setPref(order[(order.indexOf(pref) + 1) % order.length])}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink/80 transition duration-200 hover:bg-line/5 hover:text-ink",
        className,
      )}
    >
      <Icon size={18} strokeWidth={1.5} aria-hidden />
      {withLabel && <span>{label}</span>}
    </button>
  );
}
