"use client";

import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { Marker } from "react-map-gl/maplibre";
import { useLocale } from "next-intl";
import { BaseMap } from "./BaseMap";
import { ZonesLayer } from "./ZonesLayer";
import { polygonBbox } from "@/lib/geo";
import { zoneName } from "@/lib/utils";
import type { ZoneDTO } from "@/lib/types";

type Props = { zones: ZoneDTO[]; selectedId: number | null; onSelect: (id: number) => void; label: string };

/** Mini-mapa que resalta la zona seleccionada; también permite elegirla tocando el mapa. */
export default function ZonePickerMap({ zones, selectedId, onSelect, label }: Props) {
  const ref = useRef<MapRef>(null);
  const locale = useLocale();
  const selected = zones.find((z) => z.id === selectedId);

  useEffect(() => {
    if (!selected || !ref.current) return;
    const [a, b, c, d] = polygonBbox(selected.polygon);
    ref.current.fitBounds([a, b, c, d], { padding: 30, duration: 700, maxZoom: 13.5 });
  }, [selected]);

  return (
    <BaseMap
      ref={ref}
      label={label}
      initialViewState={{ latitude: 18.075, longitude: -15.94, zoom: 10.9 }}
      interactiveLayerIds={["zones-fill"]}
      cursor="pointer"
      scrollZoom={false}
      onClick={(e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === "number") onSelect(id);
      }}
    >
      <ZonesLayer zones={zones} highlightedId={selectedId} subtle={false} />
      {selected && (
        <Marker latitude={selected.centerLat} longitude={selected.centerLng} anchor="center">
          <span className="glass-strong pointer-events-none rounded-full px-2.5 py-1 text-xs font-medium">{zoneName(selected, locale)}</span>
        </Marker>
      )}
    </BaseMap>
  );
}
