/** Configuración centralizada de la aplicación (sin dependencias de servidor). */

/** Número del centro de llamadas (llamadas y WhatsApp), mostrado en la portada. */
export const CONTACT_PHONE = "+22222334411";

export const NKC_CENTER = { lat: 18.0858, lng: -15.9785 } as const;
export const NKC_ZOOM = 12;

/** Área aceptada para posiciones: [[minLng, minLat], [maxLng, maxLat]] */
export const NKC_BOUNDS: [[number, number], [number, number]] = [
  [-16.12, 17.9],
  [-15.75, 18.26],
];
/** Límites del mapa (maxBounds), algo más amplios que el área aceptada. */
export const NKC_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-16.25, 17.82],
  [-15.62, 18.34],
];

export const MAP_STYLE_LIGHT =
  process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT ||
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
export const MAP_STYLE_DARK =
  process.env.NEXT_PUBLIC_MAP_STYLE_DARK ||
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Posición obsoleta si no se recibe nada en 5 min. */
export const LOCATION_STALE_MS = 5 * 60 * 1000;
/** Se pasa a "no disponible" tras 6 h sin actividad. */
export const AVAILABILITY_TIMEOUT_MS = 6 * 60 * 60 * 1000;
/** Envío de posición: como máximo cada 20 s; solo si se movió > 20 m o pasaron 60 s. */
export const LOCATION_MIN_INTERVAL_MS = 20 * 1000;
export const LOCATION_MIN_DISTANCE_M = 20;
export const LOCATION_MAX_SILENCE_MS = 60 * 1000;
export const LOCATION_MAX_ACCURACY_M = 500;
/** Refresco del mapa del admin. */
export const ADMIN_REFRESH_MS = 20 * 1000;

export const LANGUAGES = ["ar", "hassaniya", "fr", "wo", "ff", "snk", "en"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export const LOCALES = ["fr", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "fr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const PAGE_SIZE = 12;

/**
 * Plugin de texto RTL de MapLibre: une y ordena correctamente las letras árabes de las etiquetas
 * del mapa (sin él salen sueltas y al revés). Servido localmente desde /public/vendor.
 */
export const MAP_RTL_PLUGIN_URL = "/vendor/mapbox-gl-rtl-text-0.3.0.js";
