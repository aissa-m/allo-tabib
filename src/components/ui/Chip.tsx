import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: LucideIcon;
  tone?: "sage" | "slate" | "terra";
  /** Sobre el mapa: fondo casi opaco y sombra para que se lea sobre cualquier estilo de mapa. */
  floating?: boolean;
};

const activeTone = {
  sage: "border-sage/50 bg-sage/15 text-ink dark:bg-sage/20",
  slate: "border-slate/50 bg-slate/15 text-ink dark:bg-slate/20",
  terra: "border-terra/50 bg-terra/15 text-ink dark:bg-terra/20",
};

const floatingActiveTone = {
  sage: "border-sage bg-sage text-white shadow-glass",
  slate: "border-slate bg-slate text-white shadow-glass",
  terra: "border-terra bg-terra text-white shadow-glass",
};

/** Chip de filtro conmutable con icono. */
export function Chip({ active, icon: Icon, tone = "sage", floating, className, children, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm transition duration-200 hover:-translate-y-px active:scale-[0.97]",
        floating
          ? active
            ? floatingActiveTone[tone]
            : "border-line/10 bg-white/90 text-ink shadow-glass backdrop-blur-md hover:bg-white dark:border-white/10 dark:bg-[#1A2530]/90 dark:hover:bg-[#22303C]"
          : active
          ? activeTone[tone]
          : "border-white/40 bg-white/50 text-ink/80 backdrop-blur-md hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={15} strokeWidth={1.5} aria-hidden />}
      {children}
    </button>
  );
}

/** Etiqueta estática (no interactiva). */
export function Badge({
  icon: Icon,
  tone = "neutral",
  className,
  children,
}: {
  icon?: LucideIcon;
  tone?: "neutral" | "sage" | "slate" | "terra" | "online" | "offline";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-line/[0.06] text-ink/75",
    sage: "bg-sage/15 text-sage",
    slate: "bg-slate/15 text-slate",
    terra: "bg-terra/15 text-terra",
    online: "bg-online/15 text-online",
    offline: "bg-offline/15 text-offline",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {Icon && <Icon size={13} strokeWidth={1.5} aria-hidden />}
      {children}
    </span>
  );
}
