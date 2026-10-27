import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, zodError } from "@/lib/api";
import { professionalsQuerySchema, searchParamsToObject } from "@/lib/validation";
import { expireStaleAvailability, professionalInclude, toDetailDTO } from "@/lib/professionals";
import { PAGE_SIZE } from "@/lib/constants";
import type { ProfessionalsPage } from "@/lib/types";

export const runtime = "nodejs";

/** Todos los profesionales registrados (consulta). Solo ADMIN. */
export async function GET(req: Request) {
  const r = await requireRole("ADMIN");
  if (r.error) return r.error;

  const parsed = professionalsQuerySchema.safeParse(searchParamsToObject(new URL(req.url).searchParams));
  if (!parsed.success) return zodError(parsed.error);
  const q = parsed.data;

  await expireStaleAvailability();

  const and: Prisma.ProfessionalWhereInput[] = [];
  if (q.q) {
    const digits = q.q.replace(/\D/g, "");
    // Cada palabra debe coincidir con nombre o apellido; o bien teléfono / NNI.
    const nameTerms = q.q.split(/\s+/).filter(Boolean).map((term) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" as const } },
        { lastName: { contains: term, mode: "insensitive" as const } },
      ],
    }));
    const or: Prisma.ProfessionalWhereInput[] = [{ AND: nameTerms }];
    if (digits.length >= 3) {
      or.push({ nni: { contains: digits } }, { user: { phone: { contains: digits } } });
    }
    and.push({ OR: or });
  }
  if (q.type) and.push({ type: q.type });
  if (q.specialty.length) and.push({ specialtyId: { in: q.specialty } });
  if (q.zone) and.push({ OR: [{ homeZoneId: q.zone }, { currentZoneId: q.zone }] });
  if (q.available !== undefined) and.push({ isAvailable: q.available });
  const where: Prisma.ProfessionalWhereInput = and.length ? { AND: and } : {};

  const orderBy: Prisma.ProfessionalOrderByWithRelationInput[] =
    q.sort === "name"
      ? [{ lastName: "asc" }, { firstName: "asc" }]
      : q.sort === "recent"
        ? [{ createdAt: "desc" }]
        : [{ isAvailable: "desc" }, { lastName: "asc" }, { firstName: "asc" }];

  const [total, rows] = await Promise.all([
    prisma.professional.count({ where }),
    prisma.professional.findMany({
      where,
      orderBy,
      include: professionalInclude,
      skip: (q.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const body: ProfessionalsPage = {
    items: rows.map(toDetailDTO),
    total,
    page: q.page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
  return NextResponse.json(body);
}
