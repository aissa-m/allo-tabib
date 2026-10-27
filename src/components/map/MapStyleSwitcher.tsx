/* eslint-disable @next/next/no-img-element -- miniaturas estáticas pequeñas */
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, Layers } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useMapStyle } from "./MapStyleProvider";
import { MAP_STYLE_IDS, mapStyleThumbnail, resolveMapStyle } from "@/lib/mapStyles";
import { cn } from "@/lib/utils";

const PANEL_W = 288;

type Props = {
  /** "thumb": miniatura con «Calques» (escritorio, como Google Maps). "icon": botón con icono (móvil). */
  variant?: "thumb" | "icon";
  className?: string;
};

/** Selector de tipo de mapa: Par défaut, Clair, Couleurs, Sombre, Satellite. */
export function MapStyleSwitcher({ variant = "icon", className }: Props) {
  const t = useTranslations("map");
  const { resolved: theme } = useTheme();
  const { id, setId, resolved } = useMapStyle();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // El panel va en un portal con posición fija: no lo recortan los contenedores del mapa.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const h = panelRef.current?.offsetHeight ?? 260;
      const openUp = r.bottom + 8 + h > window.innerHeight && r.top - 8 - h > 0;
      const rawLeft = r.left + r.width / 2 > window.innerWidth / 2 ? r.right - PANEL_W : r.left;
      setPos({
        top: openUp ? r.top - 8 - h : r.bottom + 8,
        left: Math.max(8, Math.min(rawLeft, window.innerWidth - PANEL_W - 8)),
      });
    };
    place();
    const raf = requestAnimationFrame(place); // segunda pasada con la altura real del panel
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = `${t("layers")}: ${t(`styles.${id}`)}`;

  return (
    <>
      {variant === "thumb" ? (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={label}
          title={label}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "group relative h-[72px] w-[72px] overflow-hidden rounded-2xl border-2 border-white shadow-glass transition duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:border-white/20",
            className,
          )}
        >
          <img src={mapStyleThumbnail(resolved)} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent pb-1 pt-3 text-[11px] font-medium text-white">
            <Layers size={12} strokeWidth={1.75} aria-hidden />
            {t("layers")}
          </span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={label}
          title={label}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "glass-strong inline-flex h-11 w-11 items-center justify-center rounded-xl shadow-glass transition duration-200 hover:-translate-y-px",
            className,
          )}
        >
          <Layers size={20} strokeWidth={1.5} aria-hidden />
        </button>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-label={t("mapType")}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: PANEL_W }}
                className="glass-strong fixed z-[95] p-3"
              >
                <p className="mb-2.5 px-1 text-sm font-semibold">{t("mapType")}</p>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("mapType")}>
                  {MAP_STYLE_IDS.map((s) => {
                    const on = id === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setId(s);
                          setOpen(false);
                        }}
                        className="group flex flex-col items-center gap-1.5 rounded-xl p-1 text-xs transition hover:bg-line/5"
                      >
                        <span
                          className={cn(
                            "relative block h-16 w-16 overflow-hidden rounded-xl border-2 transition",
                            on ? "border-sage" : "border-transparent group-hover:border-line/20",
                          )}
                        >
                          <img src={mapStyleThumbnail(resolveMapStyle(s, theme))} alt="" className="h-full w-full object-cover" />
                          {on && (
                            <span className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sage text-white shadow">
                              <Check size={12} strokeWidth={2.5} aria-hidden />
                            </span>
                          )}
                        </span>
                        <span className={cn(on ? "font-medium text-ink" : "text-ink/75")}>{t(`styles.${s}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
