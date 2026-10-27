/* eslint-disable @next/next/no-img-element -- las fotos se sirven con sesión desde /api/files, sin optimizador */
"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { src?: string | null; alt: string; size?: number; className?: string; ring?: "sage" | "slate" | "none" };

export function Avatar({ src, alt, size = 48, className, ring = "none" }: Props) {
  // Se guarda la URL que falló: si cambia la foto, se vuelve a intentar.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !!src && failedSrc === src;
  const ringCls = ring === "sage" ? "ring-2 ring-sage" : ring === "slate" ? "ring-2 ring-slate" : "";
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full bg-bg-soft", ringCls, className)}
      style={{ width: size, height: size }}
    >
      {src && !failed ? (
        <img src={src} alt={alt} width={size} height={size} loading="lazy" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted">
          <UserRound size={size * 0.5} strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  );
}
