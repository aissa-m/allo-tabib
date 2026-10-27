"use client";

import { Marker } from "react-map-gl/maplibre";
import { useAnimatedPosition } from "./useAnimatedPosition";
import { cn } from "@/lib/utils";

/** Punto propio con pulso animado (estilo Uber). */
export function PulseDot({ lat, lng, muted, label }: { lat: number; lng: number; muted?: boolean; label: string }) {
  const pos = useAnimatedPosition({ lat, lng });
  return (
    <Marker latitude={pos.lat} longitude={pos.lng} anchor="center">
      <span role="img" aria-label={label} className="relative flex h-6 w-6 items-center justify-center">
        {!muted && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-sage/60" />}
        {!muted && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-sage/40 [animation-delay:0.9s]" />}
        <span className={cn("relative h-4 w-4 rounded-full border-[3px] border-white shadow-lg", muted ? "bg-muted" : "bg-sage")} />
      </span>
    </Marker>
  );
}
