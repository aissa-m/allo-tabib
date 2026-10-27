"use client";

import { Marker } from "react-map-gl/maplibre";
import { cn } from "@/lib/utils";

type Props = {
  lat: number;
  lng: number;
  count: number;
  /** Cuántos del grupo están disponibles. */
  available: number;
  label: string;
  highlighted?: boolean;
  onClick: () => void;
};

/**
 * Cluster: círculo con el número total y un anillo repartido en verde
 * (disponibles) y rojo (no disponibles), como un gráfico de tarta. Al pulsar, zoom al grupo.
 */
export function ClusterMarker({ lat, lng, count, available, label, highlighted, onClick }: Props) {
  const size = Math.min(64, 38 + Math.log2(count) * 7);
  const pct = count ? (available / count) * 100 : 0;
  return (
    <Marker latitude={lat} longitude={lng} anchor="center" style={{ zIndex: available ? 10 : 2 }}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          background: `conic-gradient(rgb(var(--online)) 0 ${pct}%, rgb(var(--offline)) ${pct}% 100%)`,
        }}
        className={cn(
          "flex items-center justify-center rounded-full p-[4px] shadow-glass transition duration-200 hover:scale-110",
          highlighted && "scale-110 ring-2 ring-slate ring-offset-2 ring-offset-bg",
        )}
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-bg/90 text-sm font-semibold text-ink backdrop-blur-xl">
          {count}
        </span>
      </button>
    </Marker>
  );
}
