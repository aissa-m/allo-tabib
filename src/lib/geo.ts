import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Polygon, MultiPolygon } from "geojson";
import { NKC_BOUNDS } from "./constants";

export type LatLng = { lat: number; lng: number };
export type Bbox = [number, number, number, number];

export function isInsideNouakchott({ lat, lng }: LatLng): boolean {
  const [[minLng, minLat], [maxLng, maxLat]] = NKC_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/** Distancia en metros (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type ZoneLike = { id: number; polygon: unknown };

export function findZoneId(point: LatLng, zones: ZoneLike[]): number | null {
  for (const z of zones) {
    const geom = z.polygon as Polygon | MultiPolygon;
    if (geom && booleanPointInPolygon([point.lng, point.lat], geom)) return z.id;
  }
  return null;
}

/** Bounding box [minLng, minLat, maxLng, maxLat] de un polígono. */
export function polygonBbox(polygon: unknown): Bbox {
  const geom = polygon as Polygon;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const ring of geom.coordinates) {
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function inBbox({ lat, lng }: LatLng, [minLng, minLat, maxLng, maxLat]: Bbox): boolean {
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

export function parseBbox(value: string | null | undefined): Bbox | null {
  if (!value) return null;
  const parts = value.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return parts as Bbox;
}
