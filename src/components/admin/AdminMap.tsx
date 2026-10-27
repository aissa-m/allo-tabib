"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Supercluster from "supercluster";
import { Marker, Popup, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import { useLocale, useTranslations } from "next-intl";
import { BaseMap } from "@/components/map/BaseMap";
import { ZonesLayer } from "@/components/map/ZonesLayer";
import { ProfessionalMarker } from "@/components/map/ProfessionalMarker";
import { ClusterMarker } from "@/components/map/ClusterMarker";
import { ProfessionalCard } from "@/components/professional/ProfessionalCard";
import { polygonBbox, type Bbox } from "@/lib/geo";
import { NKC_CENTER, NKC_ZOOM } from "@/lib/constants";
import { fullName, zoneName } from "@/lib/utils";
import type { ProfessionalCardDTO, ZoneDTO } from "@/lib/types";

export type MapCommand =
  | { type: "zone"; zoneId: number; nonce: number }
  | { type: "recenter"; nonce: number }
  | { type: "focus"; id: string; nonce: number };

type Props = {
  items: ProfessionalCardDTO[];
  zones: ZoneDTO[];
  highlightedZoneId: number | null;
  hoveredId: string | null;
  selectedId: string | null;
  command: MapCommand | null;
  now: number;
  /** Padding para fitBounds/flyTo (p. ej. dejar sitio a la barra de búsqueda o al bottom sheet). */
  padding: { top: number; bottom: number; left: number; right: number };
  onBoundsChange: (bbox: Bbox, userInitiated: boolean) => void;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
};

type PointProps = { id: string; available: number };

export default function AdminMap({
  items,
  zones,
  highlightedZoneId,
  hoveredId,
  selectedId,
  command,
  now,
  padding,
  onBoundsChange,
  onSelect,
  onHover,
  onOpen,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const ref = useRef<MapRef>(null);
  const [view, setView] = useState<{ bbox: Bbox; zoom: number } | null>(null);

  // --- Clustering ---
  const index = useMemo(() => {
    // Cada cluster lleva la cuenta de disponibles que contiene
    const sc = new Supercluster<PointProps, { available: number }>({
      radius: 56,
      maxZoom: 15,
      map: (p) => ({ available: p.available }),
      reduce: (acc, p) => {
        acc.available += p.available;
      },
    });
    sc.load(
      items.map((p) => ({
        type: "Feature" as const,
        properties: { id: p.id, available: p.isAvailable ? 1 : 0 },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      })),
    );
    return sc;
  }, [items]);

  const clusters = useMemo(() => {
    if (!view) return [];
    return index.getClusters(view.bbox, Math.round(view.zoom));
  }, [index, view]);

  const byId = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);

  const syncView = useCallback(
    (userInitiated: boolean) => {
      const map = ref.current;
      if (!map) return;
      const b = map.getBounds();
      const bbox: Bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      setView({ bbox, zoom: map.getZoom() });
      onBoundsChange(bbox, userInitiated);
    },
    [onBoundsChange],
  );

  // --- Órdenes desde la vista (buscar zona, recentrar, enfocar) ---
  useEffect(() => {
    const map = ref.current;
    if (!map || !command) return;
    if (command.type === "zone") {
      const z = zones.find((x) => x.id === command.zoneId);
      if (z) {
        const [a, b, c, d] = polygonBbox(z.polygon);
        map.fitBounds([a, b, c, d], { padding, duration: 1100, maxZoom: 14.5 });
      }
    } else if (command.type === "recenter") {
      map.flyTo({ center: [NKC_CENTER.lng, NKC_CENTER.lat], zoom: NKC_ZOOM, duration: 1000, padding });
    } else if (command.type === "focus") {
      const p = byId.get(command.id);
      if (p) map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 14), duration: 800, padding });
    }
    // Solo reacciona a órdenes nuevas (nonce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.nonce]);

  // Cluster resaltado si contiene el profesional señalado en la lista
  const activeId = hoveredId ?? selectedId;
  const activeClusterId = useMemo(() => {
    if (!activeId) return null;
    for (const c of clusters) {
      const props = c.properties as { cluster?: boolean; cluster_id?: number };
      if (props.cluster && props.cluster_id != null) {
        const leaves = index.getLeaves(props.cluster_id, Infinity);
        if (leaves.some((l) => l.properties.id === activeId)) return props.cluster_id;
      }
    }
    return null;
  }, [activeId, clusters, index]);

  const selected = selectedId ? byId.get(selectedId) : undefined;
  const highlightedZone = zones.find((z) => z.id === highlightedZoneId);

  return (
    <BaseMap
      ref={ref}
      label={t("admin.mapLabel")}
      initialViewState={{ latitude: NKC_CENTER.lat, longitude: NKC_CENTER.lng, zoom: NKC_ZOOM }}
      onLoad={() => syncView(false)}
      onMoveEnd={(e: ViewStateChangeEvent) => syncView(!!e.originalEvent)}
      onClick={() => onSelect(null)}
    >
      <ZonesLayer zones={zones} highlightedId={highlightedZoneId} />

      {highlightedZone && (
        <Marker latitude={highlightedZone.centerLat} longitude={highlightedZone.centerLng} anchor="center" style={{ zIndex: 0 }}>
          <span className="pointer-events-none select-none rounded-full bg-slate/80 px-3 py-1 text-xs font-medium text-white shadow-glass backdrop-blur">
            {zoneName(highlightedZone, locale)}
          </span>
        </Marker>
      )}

      {clusters.map((c) => {
        const [lng, lat] = c.geometry.coordinates;
        const props = c.properties as { cluster?: boolean; cluster_id?: number; point_count?: number; available?: number; id?: string };
        if (props.cluster && props.cluster_id != null) {
          const clusterId = props.cluster_id;
          return (
            <ClusterMarker
              key={`c-${clusterId}`}
              lat={lat}
              lng={lng}
              count={props.point_count ?? 0}
              available={props.available ?? 0}
              label={t("admin.zoomIn")}
              highlighted={activeClusterId === clusterId}
              onClick={() => {
                const zoom = Math.min(index.getClusterExpansionZoom(clusterId), 17);
                ref.current?.flyTo({ center: [lng, lat], zoom, duration: 700 });
              }}
            />
          );
        }
        const p = props.id ? byId.get(props.id) : undefined;
        if (!p) return null;
        return (
          <ProfessionalMarker
            key={p.id}
            pro={p}
            highlighted={hoveredId === p.id}
            selected={selectedId === p.id}
            label={`${fullName(p)} · ${t(`types.${p.type}`)} · ${t(p.isAvailable ? "status.available" : "status.unavailable")}`}
            onClick={onSelect}
            onHover={onHover}
          />
        );
      })}

      {selected && (
        <Popup
          latitude={selected.lat}
          longitude={selected.lng}
          anchor="bottom"
          offset={34}
          closeButton={false}
          closeOnClick={false}
          maxWidth="340px"
          className="glass-popup"
          onClose={() => onSelect(null)}
        >
          <div className="w-[min(320px,calc(100vw-2rem))]" dir={locale === "ar" ? "rtl" : "ltr"}>
            <ProfessionalCard pro={selected} now={now} onOpen={onOpen} strong />
          </div>
        </Popup>
      )}
    </BaseMap>
  );
}
