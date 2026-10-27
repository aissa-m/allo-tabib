import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, zodError } from "@/lib/api";
import { locationSchema } from "@/lib/validation";
import { findZoneId, isInsideNouakchott } from "@/lib/geo";
import { LOCATION_MAX_ACCURACY_M } from "@/lib/constants";
import { expireStaleAvailability } from "@/lib/professionals";

export const runtime = "nodejs";

/** Guarda solo la última posición del profesional disponible. */
export async function POST(req: Request) {
  const r = await requireRole("PROFESSIONAL");
  if (r.error) return r.error;

  const parsed = locationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);
  const { lat, lng, accuracy, manual } = parsed.data;

  // La precisión solo se comprueba para el GPS; la posición manual la elige el profesional en el mapa.
  if (!manual && accuracy > LOCATION_MAX_ACCURACY_M) return jsonError(422, "inaccurate");
  if (!isInsideNouakchott({ lat, lng })) return jsonError(422, "outside");

  await expireStaleAvailability();
  const pro = await prisma.professional.findUnique({ where: { userId: r.session.user.id } });
  if (!pro) return jsonError(404, "notFound");
  if (!pro.isAvailable) return jsonError(409, "notAvailable");

  const zones = await prisma.zone.findMany({ select: { id: true, polygon: true } });
  const currentZoneId = findZoneId({ lat, lng }, zones);
  const now = new Date();

  await prisma.professional.update({
    where: { id: pro.id },
    data: { lat, lng, locationUpdatedAt: now, currentZoneId, locationManual: manual },
  });
  return NextResponse.json({ ok: true, currentZoneId, locationUpdatedAt: now.toISOString() });
}
