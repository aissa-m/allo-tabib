import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Más opaco: para paneles sobre el mapa y modales. */
  strong?: boolean;
  /** Ligera elevación al pasar el ratón. */
  hoverable?: boolean;
  padded?: boolean;
};

/** Tarjeta de cristal reutilizable: base de todas las tarjetas, paneles y modales. */
export const GlassCard = forwardRef<HTMLDivElement, Props>(function GlassCard(
  { strong, hoverable, padded = true, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        strong ? "glass-strong" : "glass",
        padded && "p-5",
        hoverable && "transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
      {...rest}
    />
  );
});
