"use client";

import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useMapStyle } from "./MapStyleProvider";
import { isDarkMapStyle } from "@/lib/mapStyles";
import type { ZoneDTO } from "@/lib/types";

type Props = {
  zones: ZoneDTO[];
  highlightedId?: number | null;
  /** Dibuja solo esta zona (panel del profesional). */
  onlyId?: number | null;
  subtle?: boolean;
};

/** Polígonos de las moughataas, muy sutiles; la zona resaltada en azul pizarra. */
export function ZonesLayer({ zones, highlightedId = null, onlyId, subtle = true }: Props) {
  const { resolved } = useMapStyle();
  const dark = isDarkMapStyle(resolved);
  const data = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: zones
        .filter((z) => onlyId == null || z.id === onlyId)
        .map((z) => ({ type: "Feature", id: z.id, properties: { id: z.id }, geometry: z.polygon })),
    }),
    [zones, onlyId],
  );
  const hl = highlightedId ?? -1;
  // Sobre fondos oscuros (oscuro, satélite) las líneas van en claro para que se vean.
  const base = resolved === "satellite" ? "#EAE6DE" : dark ? "#6FA8DC" : "#226192";

  return (
    <Source id="zones" type="geojson" data={data}>
      <Layer
        id="zones-fill"
        type="fill"
        paint={{
          "fill-color": base,
          "fill-opacity": ["case", ["==", ["get", "id"], hl], 0.14, subtle ? 0.025 : 0.08],
        }}
      />
      <Layer
        id="zones-line"
        type="line"
        paint={{
          "line-color": base,
          "line-opacity": ["case", ["==", ["get", "id"], hl], 0.9, subtle ? 0.28 : 0.6],
          "line-width": ["case", ["==", ["get", "id"], hl], 2.2, 1],
          "line-dasharray": subtle ? [2, 2] : [1, 0],
        }}
      />
    </Source>
  );
}
