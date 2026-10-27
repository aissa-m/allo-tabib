import type { LayerSpecification, RasterSourceSpecification, StyleSpecification } from "maplibre-gl";
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from "./constants";

/**
 * Estilos de mapa seleccionables (como las "capas" de Google Maps).
 * "auto" sigue el tema de la app: claro → Positron, oscuro → Dark Matter.
 * Todos son gratuitos y sin API key; las URL se pueden cambiar con variables de entorno.
 */
export const MAP_STYLE_IDS = ["auto", "light", "voyager", "dark", "satellite"] as const;
export type MapStyleId = (typeof MAP_STYLE_IDS)[number];
export type ResolvedMapStyle = Exclude<MapStyleId, "auto">;

export const MAP_STYLE_VOYAGER =
  process.env.NEXT_PUBLIC_MAP_STYLE_VOYAGER || "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const SATELLITE_TILES =
  process.env.NEXT_PUBLIC_MAP_SATELLITE_TILES ||
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const IMAGERY_SOURCE: RasterSourceSpecification = {
  type: "raster",
  tiles: [SATELLITE_TILES],
  tileSize: 256,
  maxzoom: 19,
  attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
};

/** Solo imagen de satélite: se usa mientras se prepara la versión con etiquetas o si falla. */
export const SATELLITE_IMAGERY_STYLE: StyleSpecification = {
  version: 8,
  sources: { imagery: IMAGERY_SOURCE },
  layers: [{ id: "imagery", type: "raster", source: "imagery" }],
};

let hybridPromise: Promise<StyleSpecification> | null = null;

/**
 * Satélite "híbrido": imagen de Esri + etiquetas (calles, barrios, lugares) del estilo vectorial Voyager.
 * Las etiquetas vectoriales se dibujan con el plugin RTL, así que el árabe sale bien.
 */
export function loadHybridSatelliteStyle(): Promise<StyleSpecification> {
  if (hybridPromise) return hybridPromise;
  hybridPromise = fetch(MAP_STYLE_VOYAGER)
    .then((r) => {
      if (!r.ok) throw new Error(`style ${r.status}`);
      return r.json() as Promise<StyleSpecification>;
    })
    .then((base) => ({
      ...base,
      sources: { ...base.sources, imagery: IMAGERY_SOURCE },
      layers: [
        { id: "imagery", type: "raster", source: "imagery" } as LayerSpecification,
        // Solo las etiquetas, con halo oscuro y texto claro para leerse sobre la foto
        ...base.layers
          .filter((l): l is Extract<LayerSpecification, { type: "symbol" }> => l.type === "symbol")
          .map((l) => ({
            ...l,
            paint: { ...l.paint, "text-color": "#EAE6DE", "text-halo-color": "rgba(18,26,34,0.85)", "text-halo-width": 1.4 },
          })),
      ],
    }))
    .catch((e) => {
      hybridPromise = null;
      throw e;
    });
  return hybridPromise;
}

export function resolveMapStyle(id: MapStyleId, theme: "light" | "dark"): ResolvedMapStyle {
  return id === "auto" ? theme : id;
}

/** URL o especificación del estilo. Para satélite devuelve la versión solo-imagen (ver loadHybridSatelliteStyle). */
export function mapStyleFor(style: ResolvedMapStyle): string | StyleSpecification {
  switch (style) {
    case "light":
      return MAP_STYLE_LIGHT;
    case "dark":
      return MAP_STYLE_DARK;
    case "voyager":
      return MAP_STYLE_VOYAGER;
    case "satellite":
      return SATELLITE_IMAGERY_STYLE;
  }
}

/** Fondo oscuro (para elegir colores legibles de zonas y controles). */
export function isDarkMapStyle(style: ResolvedMapStyle): boolean {
  return style === "dark" || style === "satellite";
}

/** Miniaturas estáticas generadas a partir del propio mapa (public/map-styles). */
export function mapStyleThumbnail(style: ResolvedMapStyle): string {
  return `/map-styles/${style}.webp`;
}
