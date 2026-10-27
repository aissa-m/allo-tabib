"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

type Props = {
  label: React.ReactNode;
  icon?: LucideIcon;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
};

const PANEL_W = 256;

/**
 * Chip que abre un pequeño panel de cristal (filtros de especialidad, idioma…).
 * El panel usa posición fija en un portal para no quedar recortado por la fila de chips con scroll.
 */
export function FilterPopover({ label, icon, active, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const rtl = document.documentElement.dir === "rtl";
      const raw = rtl ? r.right - PANEL_W : r.left;
      const left = Math.max(8, Math.min(raw, window.innerWidth - PANEL_W - 8));
      setPos({ top: r.bottom + 8, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
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

  return (
    <div ref={triggerRef} className={cn("relative shrink-0", className)}>
      <Chip floating active={active} icon={icon} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        {label}
        <ChevronDown size={14} strokeWidth={1.5} aria-hidden className={cn("transition", open && "rotate-180")} />
      </Chip>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={panelRef}
                role="dialog"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{ top: pos.top, left: pos.left, width: PANEL_W }}
                className="glass-strong scroll-thin fixed z-[90] max-h-72 overflow-y-auto p-1.5"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export function PopoverOption({
  checked,
  onClick,
  children,
  multi,
}: {
  checked: boolean;
  onClick: () => void;
  children: React.ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={checked}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-line/5"
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border transition",
          multi ? "rounded" : "rounded-full",
          checked ? "border-sage bg-sage" : "border-line/30",
        )}
        aria-hidden
      >
        {checked && <span className={cn("bg-white", multi ? "h-1.5 w-1.5 rounded-sm" : "h-1.5 w-1.5 rounded-full")} />}
      </span>
      {children}
    </button>
  );
}
