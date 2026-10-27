"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Power } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = { available: boolean; pending: boolean; onToggle: () => void };

/** Gran interruptor redondeado de disponibilidad (verde de estado / gris). */
export function AvailabilityToggle({ available, pending, onToggle }: Props) {
  const t = useTranslations("pro");
  const isRtl = useLocale() === "ar";
  const travel = 116; // 200 px de ancho − 16 px de relleno − 68 px de pomo
  const x = available ? (isRtl ? -travel : travel) : 0;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        {/* Halo cuando está disponible */}
        <AnimatePresence>
          {available && (
            <motion.span
              key="halo"
              aria-hidden
              className="absolute -inset-3 rounded-full bg-online/25 blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-label={t("toggleLabel")}
          disabled={pending}
          onClick={onToggle}
          className={cn(
            "relative flex h-[5.25rem] w-[12.5rem] items-center rounded-full p-2 shadow-inner transition-colors duration-300 disabled:cursor-wait",
            available ? "bg-online" : "bg-line/15",
          )}
        >
          <motion.span
            className="z-10 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white shadow-lift dark:bg-[#EAE6DE]"
            animate={{ x }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            {pending ? (
              <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-muted" aria-hidden />
            ) : (
              <Power size={28} strokeWidth={1.75} className={cn("transition-colors", available ? "text-online" : "text-[#8a8d92]")} aria-hidden />
            )}
          </motion.span>
        </button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={available ? "on" : "off"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
          aria-live="polite"
        >
          <p className={cn("text-xl font-semibold", available ? "text-online" : "text-ink/80")}>
            {available ? t("available") : t("unavailable")}
          </p>
          <p className="mt-1 text-sm text-muted">{available ? t("availableHint") : t("unavailableHint")}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
