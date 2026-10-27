"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import { useTheme } from "@/components/ui/ThemeProvider";
import {
  MAP_STYLE_IDS,
  loadHybridSatelliteStyle,
  mapStyleFor,
  resolveMapStyle,
  type MapStyleId,
  type ResolvedMapStyle,
} from "@/lib/mapStyles";

const STORAGE_KEY = "allotabib.mapStyle";

type Ctx = {
  /** Estilo elegido (incluye "auto"). */
  id: MapStyleId;
  setId: (id: MapStyleId) => void;
  /** Estilo efectivo (auto → claro u oscuro según el tema). */
  resolved: ResolvedMapStyle;
  /** Lo que se pasa a MapLibre como mapStyle. */
  style: string | StyleSpecification;
};

const MapStyleCtx = createContext<Ctx | null>(null);

/** Estilo de mapa elegido por el usuario, compartido por todos los mapas y recordado en el dispositivo. */
export function MapStyleProvider({ children }: { children: React.ReactNode }) {
  const { resolved: theme } = useTheme();
  const [id, setIdState] = useState<MapStyleId>("auto");
  const [hybrid, setHybrid] = useState<StyleSpecification | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (MAP_STYLE_IDS as readonly string[]).includes(saved)) setIdState(saved as MapStyleId);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const setId = useCallback((next: MapStyleId) => {
    setIdState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const resolved = resolveMapStyle(id, theme);

  // El satélite con etiquetas se prepara la primera vez que se elige; mientras tanto, solo imagen.
  useEffect(() => {
    if (resolved !== "satellite" || hybrid) return;
    let cancelled = false;
    loadHybridSatelliteStyle()
      .then((s) => !cancelled && setHybrid(s))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [resolved, hybrid]);

  const style = resolved === "satellite" && hybrid ? hybrid : mapStyleFor(resolved);

  return <MapStyleCtx.Provider value={{ id, setId, resolved, style }}>{children}</MapStyleCtx.Provider>;
}

export function useMapStyle(): Ctx {
  const ctx = useContext(MapStyleCtx);
  if (!ctx) throw new Error("useMapStyle debe usarse dentro de MapStyleProvider");
  return ctx;
}
