import { cn } from "@/lib/utils";

/**
 * Imagen con variante para modo oscuro (el morado #1800AC del logo apenas se ve sobre fondo oscuro;
 * los archivos *-dark.svg lo sustituyen por #9D8CFF).
 */
function ThemedImg({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${src}.svg`} alt={alt} width={width} height={height} className={cn("shrink-0 object-contain dark:hidden", className)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${src}-dark.svg`} alt={alt} width={width} height={height} className={cn("hidden shrink-0 object-contain dark:block", className)} />
    </>
  );
}

/** Isotipo de ALLO TABIB: cruz morada/verde con figura. Igual que public/allo-tabib-icono.svg. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return <ThemedImg src="/allo-tabib-icono" alt="" width={size} height={size} className={className} />;
}

/** Logo completo (isotipo + "الو طبيب" / "ALLO TABIB"), para sitios con espacio: login, registro… */
export function FullLogo({ name, className }: { name: string; className?: string }) {
  return <ThemedImg src="/allo-tabib-logo" alt={name} width={1002} height={378} className={cn("h-16 w-auto", className)} />;
}

/**
 * Logo de cabecera, igual que public/allo-tabib-logo.svg pero con el nombre en texto para que se lea a
 * cualquier tamaño: isotipo a la izquierda (también en árabe) y "الو طبيب" encima de "ALLO TABIB", en morado.
 */
export function Logo({ name, className, iconOnly }: { name: string; className?: string; iconOnly?: boolean }) {
  return (
    <span dir="ltr" className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={42} />
      {iconOnly ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span className="flex flex-col items-center whitespace-nowrap text-sage" aria-label={name} role="img">
          <span lang="ar" className="font-arabic text-xl font-medium leading-tight">الو طبيب</span>
          <span lang="fr" className="text-[0.8rem] font-bold leading-none tracking-[0.3em] [margin-inline-end:-0.3em]">ALLO TABIB</span>
        </span>
      )}
    </span>
  );
}
