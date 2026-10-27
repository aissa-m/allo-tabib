import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, zodError } from "@/lib/api";
import { availableQuerySchema, searchParamsToObject } from "@/lib/validation";
import { expireStaleAvailability, professionalInclude, toCardDTO } from "@/lib/professionals";
import { distanceMeters, inBbox, parseBbox } from "@/lib/geo";

export const runtime = "nodejs";

/** Profesionales disponibles (o todos, con `all=true`) con los campos de la tarjeta. Solo ADMIN. */
export async function GET(req: Request) {
  const r = await requireRole("ADMIN");
  if (r.error) return r.error;

  const parsed = availableQuerySchema.safeParse(searchParamsToObject(new URL(req.url).searchParams));
  if (!parsed.success) return zodError(parsed.error);
  const q = parsed.data;

  await expireStaleAvailability();

  const where: Prisma.ProfessionalWhereInput = q.all ? {} : { isAvailable: true };
  if (q.type) where.type = q.type;
  if (q.specialty.length) where.specialtyId = { in: q.specialty };
  if (q.lang) where.languages = { has: q.lang };
  if (q.vehicle !== undefined) where.hasVehicle = q.vehicle;

  const rows = await prisma.professional.findMany({ where, include: professionalInclude });
  let items = rows.map(toCardDTO);

  // La zona efectiva (posición real o zona habitual) se calcula en toCardDTO.
  if (q.zone) {
    const zone = await prisma.zone.findUnique({ where: { id: q.zone } });
    items = items.filter((p) => p.zoneId === q.zone);
    if (zone) {
      const c = { lat: zone.centerLat, lng: zone.centerLng };
      items.sort((a, b) => distanceMeters(a, c) - distanceMeters(b, c));
    }
  }
  const bbox = parseBbox(q.bbox);
  if (bbox) items = items.filter((p) => inBbox(p, bbox));

  return NextResponse.json({ items, updatedAt: new Date().toISOString() });
}
