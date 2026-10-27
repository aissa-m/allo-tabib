"use client";

import { forwardRef } from "react";
import MapGL, { AttributionControl, type MapProps, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStyle } from "./MapStyleProvider";
import { ZoomControls } from "./ZoomControls";
import { MAP_RTL_PLUGIN_URL, NKC_CENTER, NKC_MAX_BOUNDS, NKC_ZOOM } from "@/lib/constants";

type Props = Omit<MapProps, "mapStyle"> & { children?: React.ReactNode; label?: string };

/**
 * Mapa base de Nuakchot (MapLibre + estilos vectoriales CARTO).
 * Centrado en la ciudad y limitado con maxBounds. La atribución OSM/CARTO se mantiene visible.
 */
export const BaseMap = forwardRef<MapRef, Props>(function BaseMap({ children, initialViewState, label, ...rest }, ref) {
  const { style } = useMapStyle();
  return (
    <div className="h-full w-full" role="region" aria-label={label}>
      <MapGL
        ref={ref}
        mapStyle={style}
        // Sin este plugin las etiquetas en árabe salen con las letras sueltas y al revés.
        RTLTextPlugin={{ pluginUrl: MAP_RTL_PLUGIN_URL, lazy: false }}
        initialViewState={initialViewState ?? { latitude: NKC_CENTER.lat, longitude: NKC_CENTER.lng, zoom: NKC_ZOOM }}
        maxBounds={[...NKC_MAX_BOUNDS[0], ...NKC_MAX_BOUNDS[1]] as [number, number, number, number]}
        minZoom={10.5}
        maxZoom={18}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        style={{ width: "100%", height: "100%" }}
        {...rest}
      >
        <AttributionControl compact={false} position="bottom-right" />
        <ZoomControls />
        {children}
      </MapGL>
    </div>
  );
});
