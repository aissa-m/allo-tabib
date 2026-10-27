import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, zodError } from "@/lib/api";
import { professionalInclude, toMeDTO } from "@/lib/professionals";
import { availabilitySchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const r = await requireRole("PROFESSIONAL");
  if (r.error) return r.error;

  const parsed = availabilitySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);

  const pro = await prisma.professional.findUnique({ where: { userId: r.session.user.id } });
  if (!pro) return jsonError(404, "notFound");

  const updated = await prisma.professional.update({
    where: { id: pro.id },
    include: professionalInclude,
    data: parsed.data.available
      ? { isAvailable: true, availableSince: new Date() }
      : // Al dejar de estar disponible se borra la posición actual (no se guarda historial).
        { isAvailable: false, availableSince: null, lat: null, lng: null, locationUpdatedAt: null, currentZoneId: null, locationManual: false },
  });
  return NextResponse.json(toMeDTO(updated));
}
