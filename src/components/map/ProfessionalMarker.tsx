/* eslint-disable @next/next/no-img-element -- fotos servidas con sesión desde /api/files */
"use client";

import { memo } from "react";
import { Marker } from "react-map-gl/maplibre";
import { Clock, MapPinOff } from "lucide-react";
import { useAnimatedPosition } from "./useAnimatedPosition";
import { cn } from "@/lib/utils";
import type { ProfessionalCardDTO } from "@/lib/types";

type Props = {
  pro: ProfessionalCardDTO;
  highlighted: boolean;
  selected: boolean;
  dimmed?: boolean;
  label: string;
  onClick: (id: string) => void;
  onHover?: (id: string | null) => void;
};

/**
 * Marcador HTML: foto en círculo con borde y punto de estado en verde (disponible)
 * o rojo (no disponible). Los no disponibles quedan por debajo de los disponibles.
 */
export const ProfessionalMarker = memo(function ProfessionalMarker({ pro, highlighted, selected, dimmed, label, onClick, onHover }: Props) {
  const pos = useAnimatedPosition({ lat: pro.lat, lng: pro.lng });
  const off = !pro.isAvailable;
  const ring = off ? "border-offline" : "border-online";
  const stale = !off && pro.locationStatus === "stale";
  const none = !off && pro.locationStatus === "none";
  const active = highlighted || selected;

  return (
    <Marker
      latitude={pos.lat}
      longitude={pos.lng}
      anchor="center"
      style={{ zIndex: active ? 20 : off ? 0 : stale || none ? 1 : 5 }}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(pro.id);
      }}
    >
      <button
        type="button"
        aria-label={label}
        onMouseEnter={() => onHover?.(pro.id)}
        onMouseLeave={() => onHover?.(null)}
        className={cn(
          "group relative block rounded-full transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate",
          active ? "scale-[1.3]" : "hover:scale-110",
          dimmed && !active && "opacity-55",
          stale && !active && "opacity-75",
        )}
      >
        <span
          className={cn(
            "block h-11 w-11 overflow-hidden rounded-full border-[3px] bg-bg-soft shadow-glass",
            ring,
            none && "border-dashed",
            selected && "shadow-lift ring-4 ring-white/70 dark:ring-white/20",
          )}
        >
          <img src={pro.photoUrl} alt="" className="h-full w-full object-cover" draggable={false} />
        </span>
        {/* Punto de estado */}
        <span
          className={cn(
            "absolute -end-0.5 bottom-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-[#121A22]",
            off ? "bg-offline" : "bg-online",
          )}
        >
          {stale && <Clock size={9} strokeWidth={2.5} className="text-white" aria-hidden />}
          {none && <MapPinOff size={8} strokeWidth={2.5} className="text-white" aria-hidden />}
        </span>
      </button>
    </Marker>
  );
});
