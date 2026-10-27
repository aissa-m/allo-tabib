import { cn } from "@/lib/utils";

/** Isotipo de ALLO TABIB: maletín médico marfil con cruz coral sobre fondo azul. Igual que public/logo.svg. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={cn("shrink-0 drop-shadow-sm", className)} aria-hidden>
      <defs>
        <linearGradient id="allo-tabib-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2470A8" />
          <stop offset="1" stopColor="#1B4F78" />
        </linearGradient>
        <linearGradient id="allo-tabib-bag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6F2EB" />
          <stop offset="1" stopColor="#E2DDD3" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#allo-tabib-bg)" />
      <path d="M24 22V18.6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3V22" fill="none" stroke="#D9E1EA" strokeWidth="3.6" strokeLinecap="round" />
      <rect x="13.7" y="22.6" width="36.6" height="28.3" rx="4.2" fill="#0F3556" opacity="0.35" />
      <rect x="13.7" y="21.3" width="36.6" height="28.3" rx="4.2" fill="url(#allo-tabib-bag)" />
      <path d="M17.9 22.3h28.2" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      <circle cx="32" cy="35.5" r="9.4" fill="#FAF7F2" />
      <rect x="29.9" y="28.85" width="4.2" height="13.3" rx="1.3" fill="#EF8557" />
      <rect x="25.35" y="33.4" width="13.3" height="4.2" rx="1.3" fill="#EF8557" />
    </svg>
  );
}

/** Logo completo: isotipo + nombre ("ALLO TABIB" / "الو طبيب"), con la segunda palabra en el azul principal. */
export function Logo({ name, className, iconOnly }: { name: string; className?: string; iconOnly?: boolean }) {
  const [first, ...rest] = name.split(" ");
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {iconOnly ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span className="whitespace-nowrap text-lg font-semibold tracking-wide">
          {first}
          {rest.length > 0 && <span className="text-sage"> {rest.join(" ")}</span>}
        </span>
      )}
    </span>
  );
}
