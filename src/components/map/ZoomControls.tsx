"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";

/**
 * Botones + / − para hacer zoom. Solo en escritorio (puntero fino): en móvil ya está el pellizco.
 * Van abajo a la derecha, encima de la atribución, como en Google Maps.
 */
export function ZoomControls() {
  const t = useTranslations("map");
  const { current: map } = useMap();
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    if (!map) return;
    const sync = () => setZoom(map.getZoom());
    sync();
    map.on("zoom", sync);
    return () => {
      map.off("zoom", sync);
    };
  }, [map]);

  if (!map) return null;
  const atMax = zoom != null && zoom >= map.getMaxZoom() - 0.01;
  const atMin = zoom != null && zoom <= map.getMinZoom() + 0.01;
  const btn =
    "flex h-10 w-10 items-center justify-center transition hover:bg-line/5 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div className="glass-strong absolute bottom-8 right-3 z-10 hidden flex-col overflow-hidden rounded-xl shadow-glass [@media(hover:hover)_and_(pointer:fine)]:flex">
      <button type="button" aria-label={t("zoomIn")} title={t("zoomIn")} disabled={atMax} onClick={() => map.zoomIn({ duration: 250 })} className={btn}>
        <Plus size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <span className="mx-2 h-px bg-line/10" aria-hidden />
      <button type="button" aria-label={t("zoomOut")} title={t("zoomOut")} disabled={atMin} onClick={() => map.zoomOut({ duration: 250 })} className={btn}>
        <Minus size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
