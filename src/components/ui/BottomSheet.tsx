"use client";

import { useEffect, useState } from "react";
import { motion, useAnimationControls, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  /** Altura visible cuando está plegado (px). */
  peek?: number;
  header: React.ReactNode;
  children: React.ReactNode;
  toggleLabel: string;
  /** Espacio inferior reservado (p. ej. barra de navegación móvil). */
  bottomOffset?: number;
  className?: string;
};

/** Bottom sheet de cristal que se arrastra hacia arriba (móvil). */
export function BottomSheet({ expanded, onExpandedChange, peek = 132, header, children, toggleLabel, bottomOffset = 0, className }: Props) {
  const controls = useAnimationControls();
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const update = () => setHeight(Math.round(window.innerHeight * 0.82) - bottomOffset);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [bottomOffset]);

  const collapsedY = height - peek;

  useEffect(() => {
    controls.start({ y: expanded ? 0 : collapsedY, transition: { type: "spring", stiffness: 400, damping: 40 } });
  }, [expanded, collapsedY, controls]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const goingUp = info.velocity.y < -300 || info.offset.y < -60;
    const goingDown = info.velocity.y > 300 || info.offset.y > 60;
    const next = goingUp ? true : goingDown ? false : expanded;
    onExpandedChange(next);
    controls.start({ y: next ? 0 : collapsedY, transition: { type: "spring", stiffness: 400, damping: 40 } });
  };

  return (
    <motion.section
      className={cn("glass-strong fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-b-none rounded-t-3xl", className)}
      style={{ height, bottom: bottomOffset }}
      initial={{ y: collapsedY }}
      animate={controls}
      drag="y"
      dragConstraints={{ top: 0, bottom: collapsedY }}
      dragElastic={0.06}
      dragListener
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        aria-label={toggleLabel}
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
        className="flex w-full justify-center pb-1 pt-2.5"
      >
        <span className="h-1.5 w-11 rounded-full bg-line/20" />
      </button>
      <div className="px-4 pb-2">{header}</div>
      <div
        className={cn("scroll-thin flex-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]", expanded ? "overflow-y-auto" : "overflow-hidden")}
        onPointerDownCapture={(e) => {
          // Permite desplazar la lista sin arrastrar el panel cuando está abierto.
          if (expanded) e.stopPropagation();
        }}
      >
        {children}
      </div>
    </motion.section>
  );
}
