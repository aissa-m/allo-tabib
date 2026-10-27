import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { AVAILABILITY_TIMEOUT_MS, LOCATION_STALE_MS } from "./constants";
import type { LocationStatus, MeDTO, ProfessionalCardDTO, ProfessionalDetailDTO } from "./types";

export const professionalInclude = {
  user: { select: { phone: true, email: true } },
  specialty: true,
  homeZone: true,
  currentZone: true,
} satisfies Prisma.ProfessionalInclude;

export type ProfessionalWithRelations = Prisma.ProfessionalGetPayload<{
  include: typeof professionalInclude;
}>;

/**
 * Caducidad sin cron: se ejecuta antes de cada consulta relevante.
 * Pasa a "no disponible" a quien lleva 6 h sin actividad (ni activación ni posición).
 */
export async function expireStaleAvailability(): Promise<void> {
  if (process.env.NODE_ENV !== "production") await renewDemoAvailability();
  const cutoff = new Date(Date.now() - AVAILABILITY_TIMEOUT_MS);
  await prisma.professional.updateMany({
    where: {
      isAvailable: true,
      OR: [{ availableSince: null }, { availableSince: { lt: cutoff } }],
      AND: [{ OR: [{ locationUpdatedAt: null }, { locationUpdatedAt: { lt: cutoff } }] }],
    },
    data: {
      isAvailable: false,
      availableSince: null,
      lat: null,
      lng: null,
      locationUpdatedAt: null,
      currentZoneId: null,
      locationManual: false,
    },
  });
}

/**
 * Solo en desarrollo: los perfiles del seed que siguen disponibles no caducan
 * y su posición se mantiene "en vivo" (como mucho se reescribe una vez por minuto).
 */
async function renewDemoAvailability(): Promise<void> {
  const now = new Date();
  const demo = { isAvailable: true, photoUrl: { startsWith: "/api/files/seed-" } } satisfies Prisma.ProfessionalWhereInput;
  await prisma.professional.updateMany({
    where: { ...demo, OR: [{ availableSince: null }, { availableSince: { lt: new Date(now.getTime() - 60_000) } }] },
    data: { availableSince: now },
  });
  await prisma.professional.updateMany({
    where: { ...demo, lat: { not: null }, locationUpdatedAt: { lt: new Date(now.getTime() - 60_000) } },
    data: { locationUpdatedAt: now },
  });
}

export function locationStatusOf(p: { lat: number | null; locationUpdatedAt: Date | null }): LocationStatus {
  if (p.lat == null || !p.locationUpdatedAt) return "none";
  return Date.now() - p.locationUpdatedAt.getTime() > LOCATION_STALE_MS ? "stale" : "live";
}

/**
 * Desplazamiento estable (según el id) alrededor del centro de la zona habitual,
 * para que quienes no tienen posición no se apilen en el mismo punto del mapa.
 */
function spreadAroundCenter(id: string, lat: number, lng: number): { lat: number; lng: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const angle = ((h >>> 0) % 3600) / 3600 * 2 * Math.PI;
  const meters = 120 + ((h >>> 12) % 330);
  const dLat = (meters * Math.cos(angle)) / 111_320;
  const dLng = (meters * Math.sin(angle)) / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

export function toCardDTO(p: ProfessionalWithRelations): ProfessionalCardDTO {
  const status = locationStatusOf(p);
  const hasPos = status !== "none" && p.lat != null && p.lng != null;
  const zone = hasPos && p.currentZone ? p.currentZone : p.homeZone;
  const pos = hasPos ? { lat: p.lat!, lng: p.lng! } : spreadAroundCenter(p.id, p.homeZone.centerLat, p.homeZone.centerLng);
  return {
    id: p.id,
    type: p.type,
    firstName: p.firstName,
    lastName: p.lastName,
    photoUrl: p.photoUrl,
    phone: p.user.phone,
    whatsapp: p.whatsapp,
    specialtyId: p.specialtyId,
    specialty: { fr: p.specialty.nameFr, ar: p.specialty.nameAr },
    languages: p.languages,
    hasVehicle: p.hasVehicle,
    yearsExperience: p.yearsExperience,
    isAvailable: p.isAvailable,
    lat: pos.lat,
    lng: pos.lng,
    locationStatus: status,
    locationUpdatedAt: p.locationUpdatedAt?.toISOString() ?? null,
    locationManual: hasPos && p.locationManual,
    zoneId: zone.id,
    zone: { fr: zone.nameFr, ar: zone.nameAr },
  };
}

export function toDetailDTO(p: ProfessionalWithRelations): ProfessionalDetailDTO {
  return {
    ...toCardDTO(p),
    birthDate: p.birthDate.toISOString().slice(0, 10),
    sex: p.sex,
    nni: p.nni,
    email: p.user.email,
    workplace: p.workplace,
    bio: p.bio,
    homeZoneId: p.homeZoneId,
    homeZone: { fr: p.homeZone.nameFr, ar: p.homeZone.nameAr },
    availableSince: p.availableSince?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

export function toMeDTO(p: ProfessionalWithRelations): MeDTO {
  return {
    ...toDetailDTO(p),
    realLat: p.lat,
    realLng: p.lng,
    currentZoneId: p.currentZoneId,
  };
}

export async function getProfessionalByUserId(userId: string) {
  await expireStaleAvailability();
  return prisma.professional.findUnique({ where: { userId }, include: professionalInclude });
}
