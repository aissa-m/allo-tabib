"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { IconButton } from "./Button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** "center": modal clásico. "side": panel lateral desde el final (derecha en LTR, izquierda en RTL). */
  variant?: "center" | "side";
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, variant = "center", children, className }: Props) {
  const t = useTranslations("common");
  const isRtl = useLocale() === "ar";
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const side = variant === "side";
  const offX = isRtl ? "-100%" : "100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            className="absolute inset-0 bg-[#121A22]/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <div className={cn("pointer-events-none absolute inset-0 flex", side ? "justify-end" : "items-end justify-center sm:items-center sm:p-6")}>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              initial={side ? { x: offX } : { opacity: 0, y: 24, scale: 0.98 }}
              animate={side ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={side ? { x: offX } : { opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className={cn(
                "glass-strong pointer-events-auto flex flex-col overflow-hidden outline-none",
                side
                  ? "h-full w-full max-w-md rounded-none sm:rounded-s-3xl"
                  : "max-h-[92dvh] w-full max-w-lg rounded-b-none sm:rounded-3xl",
                className,
              )}
            >
              <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
                <h2 className="text-lg">{title}</h2>
                <IconButton icon={X} label={t("close")} variant="ghost" size="sm" onClick={onClose} />
              </div>
              <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
