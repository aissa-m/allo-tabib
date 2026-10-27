import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "slate" | "warning";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: Size;
  icon?: LucideIcon;
  iconEnd?: LucideIcon;
  loading?: boolean;
  block?: boolean;
};

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-sage text-white shadow-sm hover:bg-sage/90 hover:shadow-md dark:text-[#0E1A26]",
  slate: "bg-slate text-white shadow-sm hover:bg-slate/90 hover:shadow-md dark:text-[#0E1A26]",
  secondary:
    "border border-white/40 bg-white/50 text-ink backdrop-blur-md hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15",
  ghost: "text-ink/80 hover:bg-line/5 hover:text-ink",
  warning: "bg-terra text-white hover:bg-terra/90 dark:text-[#2a1a12]",
};

export const buttonSizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-xl px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-4 text-[15px]",
  lg: "h-14 gap-2.5 rounded-2xl px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", icon: Icon, iconEnd: IconEnd, loading, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  const iconSize = size === "lg" ? 22 : size === "sm" ? 16 : 18;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        "hover:-translate-y-px",
        buttonVariants[variant],
        buttonSizes[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} strokeWidth={1.5} className="animate-spin" aria-hidden />
      ) : (
        Icon && <Icon size={iconSize} strokeWidth={1.5} aria-hidden />
      )}
      {children}
      {IconEnd && <IconEnd size={iconSize} strokeWidth={1.5} aria-hidden className="rtl:-scale-x-100" />}
    </button>
  );
});

type IconButtonProps = Omit<Props, "icon" | "children"> & { icon: LucideIcon; label: string };

/** Botón solo con icono: aria-label obligatorio. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, variant = "secondary", size = "md", className, ...rest },
  ref,
) {
  const dims = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl transition duration-200 hover:-translate-y-px active:scale-95 disabled:opacity-50",
        buttonVariants[variant],
        dims,
        className,
      )}
      {...rest}
    >
      <Icon size={size === "sm" ? 16 : 20} strokeWidth={1.5} aria-hidden />
    </button>
  );
});
