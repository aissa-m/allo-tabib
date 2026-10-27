"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Interruptor pequeño accesible (role="switch"). */
export function Switch({ checked, onChange, label, disabled, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 disabled:opacity-50",
        checked ? "bg-sage" : "bg-line/15",
        checked ? "justify-end" : "justify-start",
        className,
      )}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className="h-6 w-6 rounded-full bg-white shadow" />
    </button>
  );
}
