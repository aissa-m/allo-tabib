"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, Languages } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { LOCALES, type AppLocale } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Selector de idioma visible (fr / ar / es). */
export function LocaleSwitcher({ compact, className, placement = "bottom" }: { compact?: boolean; className?: string; placement?: "bottom" | "top" | "side" }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (l: AppLocale) => {
    setOpen(false);
    start(async () => {
      await setLocale(l);
      router.refresh();
    });
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.language")}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink/80 transition duration-200 hover:bg-line/5 hover:text-ink",
          pending && "opacity-60",
        )}
      >
        <Languages size={18} strokeWidth={1.5} aria-hidden />
        {!compact && <span>{t(`locales.${locale as AppLocale}`)}</span>}
      </button>
      {open && (
        <ul
          role="listbox"
          className={cn(
            "glass-strong absolute z-50 min-w-[150px] p-1.5",
            placement === "top" && "bottom-full mb-2 start-0",
            placement === "bottom" && "top-full mt-2 end-0",
            placement === "side" && "bottom-0 start-full ms-2",
          )}
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-line/5"
                lang={l}
              >
                {t(`locales.${l}`)}
                {l === locale && <Check size={16} strokeWidth={1.5} className="text-sage" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
