"use client";

import { useEffect, useRef } from "react";
import { Marker, type MapRef } from "react-map-gl/maplibre";
import { LocateFixed, MapPin } from "lucide-react";
import { BaseMap } from "./BaseMap";
import { ZonesLayer } from "./ZonesLayer";
import { PulseDot } from "./PulseDot";
import { MapStyleSwitcher } from "./MapStyleSwitcher";
import { IconButton } from "@/components/ui/Button";
import { distanceMeters } from "@/lib/geo";
import type { ZoneDTO } from "@/lib/types";

type Props = {
  zones: ZoneDTO[];
  /** Posición a mostrar (GPS, manual o centro de la zona habitual). */
  position: { lat: number; lng: number } | null;
  zoneId: number | null;
  live: boolean;
  /** Modo manual: el profesional coloca su posición tocando el mapa o arrastrando el punto. */
  editable?: boolean;
  onPick?: (pos: { lat: number; lng: number }) => void;
  label: string;
  dotLabel: string;
  recenterLabel: string;
};

/** Mapa del profesional: solo su propia posición y el contorno de su zona actual. */
export default function ProMap({ zones, position, zoneId, live, editable, onPick, label, dotLabel, recenterLabel }: Props) {
  const ref = useRef<MapRef>(null);
  // Última posición en la que se centró el mapa: se vuelve a centrar si la posición cambia > 500 m
  // (p. ej. del centro de la zona habitual a la posición GPS real).
  const lastCentered = useRef<{ lat: number; lng: number } | null>(null);

  const recenter = () => {
    if (position) ref.current?.flyTo({ center: [position.lng, position.lat], zoom: 14.5, duration: 900 });
  };

  useEffect(() => {
    if (!position || !ref.current) return;
    // En modo manual el propio profesional mueve el punto: no se recentra para no "saltar".
    if (editable && lastCentered.current) return;
    if (lastCentered.current && distanceMeters(lastCentered.current, position) < 500) return;
    lastCentered.current = position;
    ref.current.flyTo({ center: [position.lng, position.lat], zoom: 14, duration: 1000 });
  }, [position, editable]);

  return (
    <div className="relative h-full w-full">
      <BaseMap
        ref={ref}
        label={label}
        cursor={editable ? "crosshair" : undefined}
        onClick={editable ? (e) => onPick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }) : undefined}
        onLoad={() => {
          if (position) {
            lastCentered.current = position;
            ref.current?.jumpTo({ center: [position.lng, position.lat], zoom: 14 });
          }
        }}
      >
        {zoneId != null && <ZonesLayer zones={zones} onlyId={zoneId} highlightedId={zoneId} />}
        {editable ? (
          position && (
            <Marker
              latitude={position.lat}
              longitude={position.lng}
              anchor="bottom"
              draggable
              onDragEnd={(e) => onPick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
            >
              <span role="img" aria-label={dotLabel} className="flex cursor-grab flex-col items-center active:cursor-grabbing">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-sage text-white shadow-lift">
                  <MapPin size={22} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="-mt-1 h-3 w-1 rounded-b-full bg-sage" />
              </span>
            </Marker>
          )
        ) : (
          position && <PulseDot lat={position.lat} lng={position.lng} muted={!live} label={dotLabel} />
        )}
      </BaseMap>
      <div className="absolute end-3 top-3 flex flex-col gap-2">
        {position && <IconButton icon={LocateFixed} label={recenterLabel} onClick={recenter} className="shadow-glass" />}
        <MapStyleSwitcher />
      </div>
    </div>
  );
}
